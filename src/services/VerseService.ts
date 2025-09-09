import { prisma } from "../configs";
import { Logger, NotFoundError, ServerError } from "../utils";

class VerseService {
  createVerse = async (verseData: { number: number; text: string; chapterId: string }) => {
    try {
      const verse = await prisma.verse.create({
        data: verseData,
      });
      return verse;
    } catch (error) {
      Logger.error("Failed to create verse", error);
      throw new ServerError("Failed to create new verse");
    }
  };

  getVerse = async (verseId?: string, number?: number) => {
    try {
      const verse = await prisma.verse.findFirst({
        where: {
          OR: [{ number }, { id: verseId }],
        },
      });
      if (!verse) throw new NotFoundError("verse not found");
      return verse;
    } catch (error) {
      Logger.error(`Failed to fetch verse with id:${verseId}`, error);
      throw new ServerError("Failed to fetch verse");
    }
  };

  getAllVerses = async (chapterId?: string) => {
    try {
      let verses;
      let count;

      if (chapterId) {
        const result = await prisma.verse.findMany({
          where: { chapterId },
        });
        verses = result;
        count = await prisma.verse.count({
          where: { chapterId },
        });
      } else {
        const result = await prisma.verse.findMany();
        verses = result;
        count = await prisma.verse.count();
      }

      if (!verses || count === 0) {
        throw new NotFoundError("Verses not found");
      }

      return verses;
    } catch (error) {
      Logger.error(`Failed to fetch verses`, error);
      throw new ServerError("Failed to fetch verses");
    }
  };

  editVerse = async (
    verseData: { number: number; text: string; chapterId: string },
    verseId?: string,
    number?: number
  ) => {
    try {
      const verse = await prisma.verse.findFirst({
        where: {
          OR: [
            ...(verseId ? [{ id: verseId }] : []),
            ...(number ? [{ number, chapterId: verseData.chapterId }] : []),
          ],
        },
      });

      if (!verse) throw new NotFoundError("Verse not found");

      // Verify the chapter exists
      const chapter = await prisma.chapter.findUnique({
        where: { id: verseData.chapterId },
      });
      if (!chapter) throw new NotFoundError("Chapter not found");

      // Get total number of verses in the chapter to validate number
      const totalVerses = await prisma.verse.count({
        where: { chapterId: verseData.chapterId },
      });

      // Validate new number
      if (verseData.number < 1 || verseData.number > totalVerses) {
        throw new Error(`Verse number must be between 1 and ${totalVerses}`);
      }

      // If number is changing, adjust other verses' numbers
      if (verseData.number !== verse.number) {
        await prisma.$transaction(async (tx) => {
          // If new number is less than current, shift verses up
          if (verseData.number < verse.number) {
            await tx.verse.updateMany({
              where: {
                chapterId: verseData.chapterId,
                number: {
                  gte: verseData.number,
                  lt: verse.number,
                },
              },
              data: {
                number: { increment: 1 },
                updatedAt: new Date(),
              },
            });
          }
          // If new number is greater than current, shift verses down
          else if (verseData.number > verse.number) {
            await tx.verse.updateMany({
              where: {
                chapterId: verseData.chapterId,
                number: {
                  gt: verse.number,
                  lte: verseData.number,
                },
              },
              data: {
                number: { decrement: 1 },
                updatedAt: new Date(),
              },
            });
          }

          // Update the verse with new data
          await tx.verse.update({
            where: { id: verse.id },
            data: { ...verseData, updatedAt: new Date() },
          });
        });
      } else {
        // If number isn't changing, just update the verse
        await prisma.verse.update({
          where: { id: verse.id },
          data: { ...verseData, updatedAt: new Date() },
        });
      }

      // Fetch and return the updated verse
      const updatedVerse = await prisma.verse.findUnique({
        where: { id: verse.id },
      });

      return updatedVerse;
    } catch (error) {
      Logger.error(`Failed to fetch book with id:${verseId}`, error);
      throw new ServerError("Failed to fetch book");
    }
  };

  deleteVerse = async (verseId?: string, number?: number, chapterId?: string) => {
    try {
      // Find the verse to delete, ensuring it matches the chapterId if number is provided
      const verse = await prisma.verse.findFirst({
        where: {
          OR: [
            ...(verseId ? [{ id: verseId }] : []),
            ...(number && chapterId ? [{ number, chapterId }] : []),
          ],
        },
      });

      if (!verse) throw new NotFoundError("Verse not found");

      // Perform deletion and reindex in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the verse
        await tx.verse.delete({
          where: { id: verse.id },
        });

        // Decrement number for all verses after the deleted verse's number in the same chapter
        await tx.verse.updateMany({
          where: {
            chapterId: verse.chapterId,
            number: {
              gt: verse.number,
            },
          },
          data: {
            number: { decrement: 1 },
          },
        });
      });

      return true;
    } catch (error) {
      Logger.error(`Failed to fetch verse with id:${verseId}`, error);
      throw new ServerError("Failed to fetch verse");
    }
  };
}

export default VerseService;
