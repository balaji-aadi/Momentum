import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import sprintController from "../services/sprint-service/sprint.controller.js";

const router = express.Router();

router.use(verifyJWT); // Protect all sprint routes

router.post("/create", sprintController.createSprint);
router.get("/project/:projectId", sprintController.getSprintsByProject);
router.put("/:sprintId", sprintController.updateSprint);
router.delete("/:sprintId", sprintController.deleteSprint);

export default router;
