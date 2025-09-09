import { Router } from "express";
import { VerseController } from "../controllers";
import { authenticate } from "../middlewares";

const router = Router();
const verseController = new VerseController();

router.use(authenticate);

router.route("/").post(verseController.createVerse).get(verseController.getAllVerses);

router.route("/:id").put(verseController.editVerse).delete(verseController.deleteVerse);

export default router;
