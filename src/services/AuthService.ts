import jwt, { SignOptions } from "jsonwebtoken";
import { prisma, Prisma, env } from "../configs";
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  Logger,
  CryptoUtils,
  ServerError,
} from "../utils";
import { JWTPayload } from "../types";

class AuthService {
  signup = async (userData: { username: string; password: string; role: string }) => {
    try {
      const existingUser = await prisma.adminUser.findFirst({
        where: { username: userData.username },
      });

      if (existingUser) throw new ConflictError("Admin with this username already exist");

      const password = await CryptoUtils.hashPassword(userData.password);
      const admin = await prisma.adminUser.create({
        data: { username: userData.username, password, role: "ADMIN" },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return admin;
    } catch (error) {
      Logger.error("Admin signup failed", error);
      throw new ServerError();
    }
  };

  login = async (credentials: { username: string; password: string }) => {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { username: credentials.username },
      });
      if (!admin) throw new AuthenticationError("Invalid Credentials");
      const isValidPassword = await CryptoUtils.verifyPassword(
        admin.password,
        credentials.password
      );
      if (!isValidPassword) throw new AuthenticationError("Invalid Credentials");
      const tokens = this.generateTokens(admin.id, admin.username);
      return {
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
        tokens,
      };
    } catch (error) {
      Logger.error("Admin login in failed", error);
      throw new ServerError();
    }
  };

  refreshToken = async (refreshToken: string) => {
    try {
      const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN) as JWTPayload;
      if (payload.type !== "refresh") throw new AuthenticationError("Invalid token type");

      const user = await prisma.adminUser.findUnique({
        where: { id: payload.userId },
        select: { id: true, username: true, role: true },
      });

      if (!user) throw new AuthenticationError("User not found");

      return this.generateTokens(user.id, user.username);
    } catch (error) {
      throw new AuthenticationError("Invalid refresh token");
    }
  };

  private generateTokens = (userId: string, username: string) => {
    const accessPayload: JWTPayload = {
      userId,
      username,
      type: "access",
    };

    const refreshPayload: JWTPayload = {
      userId,
      username,
      type: "refresh",
    };

    const accessToken = jwt.sign(accessPayload, env.ACCESS_TOKEN, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN + "hr",
    } as SignOptions);

    const refreshToken = jwt.sign(refreshPayload, env.REFRESH_TOKEN, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN + "d",
    } as SignOptions);
    return { accessToken, refreshToken };
  };
}

export default AuthService;
