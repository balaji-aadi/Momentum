import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import noteController from "./note.controller.js";

const router = Router();

// Secure all note routes
router.use(verifyJWT);

router.route("/")
  .get(noteController.getNotes)
  .post(noteController.createNote);

router.route("/:id")
  .put(noteController.updateNote)
  .delete(noteController.deleteNote);

router.route("/ai-enhance")
  .post(noteController.aiEnhance);

export default router;
