import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import sprintController from './sprint.controller.js';

const router = Router();

router.route("/create-sprint").post(verifyJWT, sprintController.createSprint);
router.route("/update-sprint/:sprintId").put(verifyJWT, sprintController.updateSprint);
router.route("/get-sprints/:projectId").get(verifyJWT, sprintController.getSprintsByProject);
router.route("/delete-sprint/:sprintId").delete(verifyJWT, sprintController.deleteSprint);

export default router;
