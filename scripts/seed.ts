import { prisma } from "../src/configs/prisma.config";
import * as fs from "fs/promises";
import * as path from "path";

// Define the JSON data structure
interface Verse {
  number: string;
  text: string;
}

interface Chapter {
  number: string;
  verses: Verse[];
}

interface Book {
  name: string;
  testament: string;
  chapters: Chapter[];
}

interface BibleData {
  version: string;
  books: Book[];
}

async function seedDatabase() {
  try {
    console.log("seeding started");
    // Read and parse the JSON file from the data folder
    const filePath = path.join(__dirname, "../data/bibleData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const bibleData: BibleData = JSON.parse(fileContent);
    console.log("Bible data fetched");

    // Map JSON testament to enum values
    const testamentMap: { [key: string]: "OLD" | "NEW" | "CUSTOM" } = {
      old: "OLD",
      new: "NEW",
      custom: "CUSTOM",
    };

    // Seed books, chapters, and verses
    for (const [index, bookData] of bibleData.books.entries()) {
      console.log(bookData.name);
      // Create or update book
      const book = await prisma.book.upsert({
        where: { name: bookData.name },
        update: {
          testament: testamentMap[bookData.testament] || "CUSTOM",
          orderIndex: index,
          updatedAt: new Date(),
        },
        create: {
          name: bookData.name,
          testament: testamentMap[bookData.testament] || "CUSTOM",
          orderIndex: index,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(bookData.name + " added. starting chapters");

      for (const chapterData of bookData.chapters) {
        // Create or update chapter
        console.log("Chapter one started");
        const chapter = await prisma.chapter.upsert({
          where: {
            BookChapterUnique: {
              bookId: book.id,
              number: parseInt(chapterData.number),
            },
          },
          update: {
            updatedAt: new Date(),
          },
          create: {
            number: parseInt(chapterData.number),
            bookId: book.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Batch create verses
        const verses = chapterData.verses.map((verse) => ({
          number: parseInt(verse.number),
          text: verse.text,
          chapterId: chapter.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await prisma.verse.createMany({
          data: verses,
          skipDuplicates: true, // Skip if verse already exists
        });
        console.log(`${book.name} chapter: ${chapter.number} is done`);
      }
    }

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase();
