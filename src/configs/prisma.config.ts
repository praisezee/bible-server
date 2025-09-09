import { PrismaClient, Prisma } from "../generated/prisma";
import { Logger } from "../utils";
import { withAccelerate } from "@prisma/extension-accelerate";

class DatabaseService {
  private static instance: PrismaClient;
  public static getInstance = (): PrismaClient => {
    if (!this.instance) {
      let client = new PrismaClient({
        log: [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "info" },
          { emit: "event", level: "warn" },
        ],
      });

      if (process.env.NODE_ENV === "development") {
        client.$on("query", (e) => {
          Logger.debug(`Query: ${e.query}`);
          Logger.debug(`Params: ${e.params}`);
          Logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      client.$on("error", (e) => {
        Logger.error("Database error:", e);
      });

      // Assign the extended client back to the instance
      this.instance = client.$extends(withAccelerate()) as unknown as PrismaClient;
    }
    return this.instance;
  };

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
    }
  }
}

const prisma = DatabaseService.getInstance();

export { prisma, Prisma };
