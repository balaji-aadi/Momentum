import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import projectController from './project.controller.js';

const router = Router();

router.route("/create-project").post(verifyJWT, projectController.createProject)
router.route("/update-project/:projectId").put(verifyJWT, projectController.updateProject)
router.route("/get-projects/:projectId").get(verifyJWT, projectController.getProjectById)
router.route("/get-all-projects").post(verifyJWT, projectController.getAllProject)
router.route("/delete-project/:projectId").delete(verifyJWT, projectController.deleteProject)


export default router;