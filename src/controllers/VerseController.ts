import { Request, Response } from "express";
import { VerseService } from "../services";
import { asyncHandler, AuthenticatedRequest } from "../middlewares";
import { prisma } from "../configs";
import { ApiResponse } from "../types";
import { AuthenticationError, NotFoundError, ValidationError } from "../utils";

class VerseController {
  private verseService = new VerseService();

  createVerse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { number, chapterId, text } = req.body;

    // Validate name
    if (!number || typeof number !== "number") {
      throw new ValidationError("Invalid verse number type");
    }

    // Validate orderIndex
    if (chapterId || typeof chapterId !== "string") {
      throw new ValidationError("Invalid chapter Id");
    }

    if (text || typeof text !== "string") {
      throw new ValidationError("Invalid text Id");
    }

    if (text.length < 3) {
      throw new ValidationError("Text must be greater than 5");
    }
    const verse = await this.verseService.createVerse({ number, text, chapterId });
    const response: ApiResponse = this.setSuccessResponse(
      "A Verse was successfully created",
      verse
    );
    res.status(201).json(response);
  });

  getAllVerses = asyncHandler(async (req: Request, res: Response) => {
    const { chapterId } = req.query;
    const verse = await this.verseService.getAllVerses(chapterId as string | undefined);
    const response: ApiResponse = this.setSuccessResponse("Verse data fetched", verse);
    res.json(response);
  });

  editVerse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { number, chapterId, text } = req.body;
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid Verse Id");

    // Validate name
    if (!number || typeof number !== "number") {
      throw new ValidationError("Invalid verse number type");
    }

    // Validate orderIndex
    if (chapterId || typeof chapterId !== "string") {
      throw new ValidationError("Invalid chapter Id");
    }

    if (text || typeof text !== "string") {
      throw new ValidationError("Invalid text Id");
    }

    if (text.length < 3) {
      throw new ValidationError("Text must be greater than 5");
    }
    const verse = await this.verseService.editVerse({ number, text, chapterId }, id);
    const response: ApiResponse = this.setSuccessResponse("A verse was successfully Edit", verse);
    res.status(201).json(response);
  });

  deleteVerse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid Verse Id");
    await this.verseService.deleteVerse(id);
    const response: ApiResponse = this.setSuccessResponse("Verse sucessfully deleted");
    res.json(response);
  });

  private checkAdmin = async (user?: { id: string; username: string; role: string }) => {
    if (!user) throw new AuthenticationError("Admin not logged in");
    const admin = await prisma.adminUser.findFirst({
      where: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
    if (!admin) throw new NotFoundError("Admin does not exist");
    return true;
  };

  private setSuccessResponse = (message: string = "Ok", data?: any): ApiResponse => {
    return {
      success: true,
      message,
      data,
    };
  };
}

export default VerseController;
