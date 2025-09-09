import { Request, Response, NextFunction } from "express";
import { Logger, AppError } from "../utils";
import { env } from "../configs";

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = undefined;

  // Log error
  Logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
    details = error.message;
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (error.name === "SyntaxError" && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  // Don't expose error details in production
  if (env.NODE_ENV.toLowerCase() === "production" && statusCode === 500) {
    message = "Something went wrong";
    details = undefined;
  } else if (env.NODE_ENV.toLowerCase() !== "production") {
    details = error.stack;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { error: details }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
export { errorHandler };
