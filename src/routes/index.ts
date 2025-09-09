import { Router } from "express";

//Import route module
import authRoute from "./auth";
import bookRoute from "./book";
import chapterRoute from "./chapter";
import verseRoute from "./verse";
import bibleRoute from "./bible";

const router = Router();

//Mounting Routes
router.use("/auth", authRoute);
router.use("/bible", bibleRoute);
router.use("/verse", verseRoute);
router.use("/book", bookRoute);
router.use("/chapter", chapterRoute);

export { router as routes };
