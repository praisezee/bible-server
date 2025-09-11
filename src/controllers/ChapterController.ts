import { Request, Response } from "express";
import { ChapterService } from "../services";
import { asyncHandler, AuthenticatedRequest } from "../middlewares";
import { prisma } from "../configs";
import { ApiResponse } from "../types";
import { AuthenticationError, NotFoundError, ValidationError } from "../utils";

class ChapterController {
  private chapterService = new ChapterService();

  createChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { number, bookId } = req.body;

    // Validate name
    if (!number || typeof number !== "number") {
      throw new ValidationError("Invalid book number type");
    }

    // Validate orderIndex
    if (bookId || typeof bookId !== "string") {
      throw new ValidationError("Invalid book Id");
    }

    const chapter = await this.chapterService.createChapter({ number, bookId });
    const response: ApiResponse = this.setSuccessResponse(
      "A chapter was successfully created",
      chapter
    );
    res.status(201).json(response);
  });

  getAllChapters = asyncHandler(async (req: Request, res: Response) => {
    const { bookId } = req.query;
    const chapter = await this.chapterService.getAllChapters(bookId as string | undefined);
    const response: ApiResponse = this.setSuccessResponse("Chapter data fetched", chapter);
    res.json(response);
  });

  editChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { number, bookId } = req.body;
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid Chapter Id");

    // Validate name
    if (!number || typeof number !== "number") {
      throw new ValidationError("Invalid book number type");
    }

    // Validate orderIndex
    if (bookId || typeof bookId !== "string") {
      throw new ValidationError("Invalid book Id");
    }

    const chapter = await this.chapterService.editChapter({ number, bookId }, id);
    const response: ApiResponse = this.setSuccessResponse("Chapter updated successfully", chapter);
    res.json(response);
  });

  deleteChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid Chapter Id");
    await this.chapterService.deleteChapter(id);
    const response: ApiResponse = this.setSuccessResponse("Chapter sucessfully deleted");
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

export default ChapterController;
