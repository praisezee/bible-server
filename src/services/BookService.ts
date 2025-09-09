import { prisma } from "../configs";
import { BibleData, BookData } from "../types";
import { Logger, NotFoundError, ServerError } from "../utils";

class BookService {
  createBook = async (bookData: {
    name: string;
    testament: "OLD" | "NEW" | "CUSTOM";
    orderIndex: number;
  }) => {
    try {
      const book = await prisma.book.create({
        data: bookData,
      });
      return book;
    } catch (error) {
      Logger.error("Failed to create book", error);
      throw new ServerError("Failed to create new book");
    }
  };

  getBook = async (bookId?: string, name?: string) => {
    try {
      const book = await prisma.book.findFirst({
        where: {
          OR: [{ name }, { id: bookId }],
        },
      });
      if (!book) throw new NotFoundError("Book not found");
      return book;
    } catch (error) {
      Logger.error(`Failed to fetch book with id:${bookId}`, error);
      throw new ServerError("Failed to fetch book");
    }
  };

  getAllBooks = async () => {
    try {
      const books = await prisma.book.findMany();
      const count = await prisma.book.count();
      if (!books || count === 0) throw new NotFoundError("Books not found");
      return books;
    } catch (error) {
      Logger.error(`Failed to fetch books}`, error);
      throw new ServerError("Failed to fetch books");
    }
  };

  getDataForApp = async (version: string = "Hebrew version"): Promise<BibleData> => {
    try {
      const books = await prisma.book.findMany({
        select: {
          name: true,
          testament: true,
          chapters: {
            select: {
              number: true,
              verses: {
                select: {
                  number: true,
                  text: true,
                },
                orderBy: {
                  number: "asc",
                },
              },
            },
            orderBy: {
              number: "asc",
            },
          },
        },
        orderBy: {
          orderIndex: "asc",
        },
      });

      const formattedBooks: BookData[] = books.map((book) => ({
        name: book.name,
        testament: book.testament.toLowerCase(),
        chapters: book.chapters.map((chapter) => ({
          number: chapter.number,
          verses: chapter.verses.map((verse) => ({
            number: verse.number,
            text: verse.text,
          })),
        })),
      }));

      return {
        version,
        books: formattedBooks,
      };
    } catch (error) {
      console.error("Error fetching Bible data:", error);
      throw new Error("Failed to fetch Bible data");
    }
  };

  editBook = async (
    bookData: { name: string; testament: "OLD" | "NEW" | "CUSTOM"; orderIndex: number },
    bookId?: string,
    name?: string
  ) => {
    try {
      // Find the book to edit
      const book = await prisma.book.findFirst({
        where: {
          OR: [{ name }, { id: bookId }],
        },
      });

      if (!book) throw new NotFoundError("Book not found");

      // Get total number of books to validate orderIndex
      const totalBooks = await prisma.book.count();

      // Validate new orderIndex
      if (bookData.orderIndex < 1 || bookData.orderIndex > totalBooks) {
        throw new Error(`orderIndex must be between 1 and ${totalBooks}`);
      }

      // If orderIndex is changing, adjust other books' orderIndex
      if (bookData.orderIndex !== book.orderIndex) {
        await prisma.$transaction(async (tx) => {
          // If new orderIndex is less than current, shift books up
          if (bookData.orderIndex < book.orderIndex) {
            await tx.book.updateMany({
              where: {
                orderIndex: {
                  gte: bookData.orderIndex,
                  lt: book.orderIndex,
                },
              },
              data: {
                orderIndex: { increment: 1 },
                updatedAt: new Date(),
              },
            });
          }
          // If new orderIndex is greater than current, shift books down
          else if (bookData.orderIndex > book.orderIndex) {
            await tx.book.updateMany({
              where: {
                orderIndex: {
                  gt: book.orderIndex,
                  lte: bookData.orderIndex,
                },
              },
              data: {
                orderIndex: { decrement: 1 },
                updatedAt: new Date(),
              },
            });
          }

          // Update the book with new data
          await tx.book.update({
            where: { id: book.id },
            data: { ...bookData, updatedAt: new Date() },
          });
        });
      } else {
        // If orderIndex isn't changing, just update the book
        await prisma.book.update({
          where: { id: book.id },
          data: { ...bookData, updatedAt: new Date() },
        });
      }

      // Fetch and return the updated book
      const updatedBook = await prisma.book.findUnique({
        where: { id: book.id },
      });

      return updatedBook;
    } catch (error) {
      Logger.error(`Failed to fetch book with id:${bookId}`, error);
      throw new ServerError("Failed to fetch book");
    }
  };

  deleteBook = async (bookId?: string, name?: string) => {
    try {
      const book = await prisma.book.findFirst({
        where: {
          OR: [{ name }, { id: bookId }],
        },
      });
      if (!book) throw new NotFoundError("Book not found");
      // Perform deletion and reindex in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the book
        await tx.book.delete({
          where: { id: book.id },
        });

        // Decrement orderIndex for all books after the deleted book's orderIndex
        await tx.book.updateMany({
          where: {
            orderIndex: {
              gt: book.orderIndex,
            },
          },
          data: {
            orderIndex: { decrement: 1 },
          },
        });
      });

      return true;
    } catch (error) {
      Logger.error(`Failed to fetch book with id:${bookId}`, error);
      throw new ServerError("Failed to fetch book");
    }
  };

  getLastUpdated = async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago from current time

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({
        where: {
          updatedAt: {
            gt: recentDate,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      const chapter = await tx.chapter.findFirst({
        where: {
          updatedAt: {
            gt: recentDate,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      const verse = await tx.verse.findFirst({
        where: {
          updatedAt: {
            gt: recentDate,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          updatedAt: true,
        },
      });

      // Get the most recent timestamp across all models
      const timestamps = [book?.updatedAt, chapter?.updatedAt, verse?.updatedAt].filter(
        (ts) => ts !== null && ts !== undefined
      );

      const latestTimestamp =
        timestamps.length > 0 ? new Date(Math.max(...timestamps.map((ts) => ts.getTime()))) : null;

      return {
        hasRecentUpdate: !!book || !!chapter || !!verse,
        latestTimestamp,
      };
    });
    return result;
  };
}

export default BookService;
