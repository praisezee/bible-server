import { prisma } from "../configs";
import { Logger, NotFoundError, ServerError } from "../utils";

class ChapterService {
  createChapter = async (chapterData: { number: number; bookId: string }) => {
    try {
      const chapter = await prisma.chapter.create({
        data: chapterData,
      });
      return chapter;
    } catch (error) {
      Logger.error("Failed to create chapter", error);
      throw new ServerError("Failed to create new chapter");
    }
  };

  getChapter = async (chapterId?: string, number?: number) => {
    try {
      const chapter = await prisma.chapter.findFirst({
        where: {
          OR: [{ number }, { id: chapterId }],
        },
      });
      if (!chapter) throw new NotFoundError("chapter not found");
      return chapter;
    } catch (error) {
      Logger.error(`Failed to fetch chapter with id:${chapterId}`, error);
      throw new ServerError("Failed to fetch chapter");
    }
  };

  getAllChapters = async (bookId?: string) => {
    try {
      let chapters;
      let count;

      if (bookId) {
        const result = await prisma.chapter.findMany({
          where: { bookId },
        });
        chapters = result;
        count = await prisma.chapter.count({
          where: { bookId },
        });
      } else {
        const result = await prisma.chapter.findMany();
        chapters = result;
        count = await prisma.chapter.count();
      }

      if (!chapters || count === 0) {
        throw new NotFoundError("Chapters not found");
      }

      return chapters;
    } catch (error) {
      Logger.error(`Failed to fetch chapters`, error);
      throw new ServerError("Failed to fetch chapters");
    }
  };

  editChapter = async (
    chapterData: { number: number; bookId: string },
    chapterId?: string,
    number?: number
  ) => {
    try {
      const chapter = await prisma.chapter.findFirst({
        where: {
          OR: [
            ...(chapterId ? [{ id: chapterId }] : []),
            ...(number ? [{ number, bookId: chapterData.bookId }] : []),
          ],
        },
      });

      if (!chapter) throw new NotFoundError("Chapter not found");

      // Verify the book exists
      const book = await prisma.book.findUnique({
        where: { id: chapterData.bookId },
      });
      if (!book) throw new NotFoundError("Book not found");

      // Get total number of chapters in the book to validate number
      const totalChapters = await prisma.chapter.count({
        where: { bookId: chapterData.bookId },
      });

      // Validate new number
      if (chapterData.number < 1 || chapterData.number > totalChapters) {
        throw new Error(`Chapter number must be between 1 and ${totalChapters}`);
      }

      // If number is changing, adjust other chapters' numbers
      if (chapterData.number !== chapter.number) {
        await prisma.$transaction(async (tx) => {
          if (chapterData.number < chapter.number) {
            await tx.chapter.updateMany({
              where: {
                bookId: chapterData.bookId,
                number: {
                  gte: chapterData.number,
                  lt: chapter.number,
                },
              },
              data: {
                number: { increment: 1 },
              },
            });
          } else if (chapterData.number > chapter.number) {
            await tx.chapter.updateMany({
              where: {
                bookId: chapterData.bookId,
                number: {
                  gt: chapter.number,
                  lte: chapterData.number,
                },
              },
              data: {
                number: { decrement: 1 },
              },
            });
          }

          await tx.chapter.update({
            where: { id: chapter.id },
            data: chapterData,
          });
        });
      } else {
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: chapterData,
        });
      }

      const updatedChapter = await prisma.chapter.findUnique({
        where: { id: chapter.id },
      });

      return updatedChapter;
    } catch (error) {
      Logger.error(`Failed to fetch book with id:${chapterId}`, error);
      throw new ServerError("Failed to fetch book");
    }
  };

  deleteChapter = async (chapterId?: string, number?: number, bookId?: string) => {
    try {
      // Find the chapter to delete, ensuring it matches the bookId if number is provided
      const chapter = await prisma.chapter.findFirst({
        where: {
          OR: [
            ...(chapterId ? [{ id: chapterId }] : []),
            ...(number && bookId ? [{ number, bookId }] : []),
          ],
        },
      });

      if (!chapter) throw new NotFoundError("Chapter not found");

      // Perform deletion and reindex in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the chapter
        await tx.chapter.delete({
          where: { id: chapter.id },
        });

        // Decrement number for all chapters after the deleted chapter's number in the same book
        await tx.chapter.updateMany({
          where: {
            bookId: chapter.bookId,
            number: {
              gt: chapter.number,
            },
          },
          data: {
            number: { decrement: 1 },
          },
        });
      });

      return true;
    } catch (error) {
      Logger.error(`Failed to fetch chapter with id:${chapterId}`, error);
      throw new ServerError("Failed to fetch chapter");
    }
  };
}

export default ChapterService;
