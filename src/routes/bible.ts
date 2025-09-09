import { Router } from "express";
import { BookController } from "../controllers";

const router = Router();
const bookController = new BookController();

router.get("/update", bookController.getLastUpdated);
router.get("/bible", bookController.getAllBooksForApp);

export default router;
