import { Request, Response } from "express";
import { BookService } from "../services";
import { asyncHandler, AuthenticatedRequest } from "../middlewares";
import { prisma } from "../configs";
import { ApiResponse } from "../types";
import { AuthenticationError, NotFoundError, ValidationError } from "../utils";

class BookController {
  private bookService = new BookService();

  createBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { name, testament, orderIndex } = req.body;

    // Validate name
    if (!name || typeof name !== "string") {
      throw new ValidationError("Invalid name type");
    }
    if (name.length < 3) {
      throw new ValidationError("Name should have at least 3 characters");
    }

    // Validate testament
    const validTestaments = ["OLD", "NEW", "CUSTOM"];
    if (!testament || !validTestaments.includes(testament)) {
      throw new ValidationError("Testament could either be OLD, NEW or CUSTOM");
    }

    // Validate orderIndex
    if (typeof orderIndex !== "number") {
      throw new ValidationError("Invalid Order Index type");
    }

    const book = await this.bookService.createBook({ name, testament, orderIndex });
    const response: ApiResponse = this.setSuccessResponse("A book was successfully created", book);
    res.status(201).json(response);
  });

  getAllBooksForApp = asyncHandler(async (req: Request, res: Response) => {
    const bible = await this.bookService.getDataForApp();
    const response: ApiResponse = this.setSuccessResponse("Bible data fetched", bible);
    res.json(response);
  });

  getAllBook = asyncHandler(async (req: Request, res: Response) => {
    const book = await this.bookService.getAllBooks();
    const response: ApiResponse = this.setSuccessResponse("Bible data fetched", book);
    res.json(response);
  });

  editBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);

    const { name, testament, orderIndex } = req.body;
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid book Id");

    // Validate name
    if (!name || typeof name !== "string") {
      throw new ValidationError("Invalid name type");
    }
    if (name.length < 3) {
      throw new ValidationError("Name should have at least 3 characters");
    }

    // Validate testament
    const validTestaments = ["OLD", "NEW", "CUSTOM"];
    if (!testament || !validTestaments.includes(testament)) {
      throw new ValidationError("Testament could either be OLD, NEW or CUSTOM");
    }

    // Validate orderIndex
    if (typeof orderIndex !== "number") {
      throw new ValidationError("Invalid Order Index type");
    }

    const book = await this.bookService.editBook({ name, testament, orderIndex }, id);
    const response: ApiResponse = this.setSuccessResponse("Book updated successfully", book);
    res.json(response);
  });

  deleteBook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.checkAdmin(req.user);
    const { id } = req.params;

    if (!id || typeof id !== "string") throw new ValidationError("Invalid book Id");
    await this.bookService.deleteBook(id);
    const response: ApiResponse = this.setSuccessResponse("Book sucessfully deleted");
    res.json(response);
  });

  getLastUpdated = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.bookService.getLastUpdated();

    const response: ApiResponse = this.setSuccessResponse("Bible data was recently updated", data);
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

export default BookController;
