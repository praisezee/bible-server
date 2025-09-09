import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env, prisma } from "../configs";
import { AuthenticationError } from "../utils";
import { JWTPayload } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization || (req.headers.Authorization as string | undefined);

    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new AuthenticationError("Access token required");

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, env.ACCESS_TOKEN) as JWTPayload;
    if (payload.type !== "access") throw new AuthenticationError("Invalid token type");

    const user = await prisma.adminUser.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
    if (!user) throw new AuthenticationError("User not found");
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }
    next(error);
  }
};

export const optional = async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, env.ACCESS_TOKEN) as JWTPayload;

      if (payload.type === "access") {
        const user = await prisma.adminUser.findUnique({
          where: {
            id: payload.userId,
          },
          select: {
            id: true,
            username: true,
            role: true,
          },
        });

        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore token errors for optional authentication
    }

    next();
  } catch (error) {
    next(error);
  }
};
