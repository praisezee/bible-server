import { Router } from "express";
import { BookController } from "../controllers";
import { authenticate } from "../middlewares";

const router = Router();
const bookController = new BookController();

router.use(authenticate);

router.route("/").get(bookController.getAllBook).post(bookController.createBook);

router.route("/:id").put(bookController.editBook).delete(bookController.deleteBook);

export default router;
