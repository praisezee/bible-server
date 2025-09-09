import { Router } from "express";
import { AuthController } from "../controllers";

const router = Router();
const authController = new AuthController();

//public route
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);

export default router;
