import { Request, Response } from "express";
import { AuthService } from "../services";
import { asyncHandler } from "../middlewares";
import { ApiResponse } from "../types";
import { ValidationError } from "../utils";
import { env } from "../configs";

class AuthController {
  private authService = new AuthService();

  signup = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || typeof username !== "string")
      throw new ValidationError("Invalid username type");
    if (!password || typeof password !== "string")
      throw new ValidationError("Invalid password type");

    const admin = await this.authService.signup({ username, password, role: "ADMIN" });
    const response: ApiResponse = {
      success: true,
      message: "Admin registration successfull",
      data: admin,
    };
    res.status(201).json(response);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || typeof username !== "string")
      throw new ValidationError("Invalid username type");
    if (!password || typeof password !== "string")
      throw new ValidationError("Invalid password type");

    const { admin, tokens } = await this.authService.login({
      username,
      password,
    });
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      maxAge: parseInt(env.REFRESH_TOKEN_EXPIRES_IN) * 20 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    const response: ApiResponse = {
      success: true,
      message: `Welcome back ${admin.username}`,
      data: {
        ...admin,
        accessToken: tokens.accessToken,
      },
    };

    res.json(response);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken)
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      maxAge: parseInt(env.REFRESH_TOKEN_EXPIRES_IN) * 20 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });

    const response: ApiResponse = {
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken: tokens.accessToken },
    };

    res.json(response);
  });
}

export default AuthController;
