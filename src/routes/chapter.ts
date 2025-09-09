import { Router } from "express";
import { ChapterController } from "../controllers";
import { authenticate } from "../middlewares";

const router = Router();
const chapterController = new ChapterController();

router.use(authenticate);

router.route("/").post(chapterController.createChapter).get(chapterController.getAllChapters);

router.route("/:id").put(chapterController.editChapter).delete(chapterController.deleteChapter);

export default router;
