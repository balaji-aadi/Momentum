import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/rbac.middleware.js";
import projectController from './project.controller.js';
import { verifyBranchAccess } from "../../middlewares/branch.middleware.js";

const router = Router();

router.route("/create-project").post(verifyJWT, verifyBranchAccess, checkPermission("CREATE_PROJECT"), projectController.createProject)
router.route("/update-project/:projectId").put(verifyJWT, verifyBranchAccess, checkPermission("UPDATE_PROJECT"), projectController.updateProject)
router.route("/get-projects/:projectId").get(verifyJWT, verifyBranchAccess, checkPermission("VIEW_PROJECT"), projectController.getProjectById)
router.route("/get-all-projects").post(verifyJWT, verifyBranchAccess, projectController.getAllProject)
router.route("/delete-project/:projectId").delete(verifyJWT, verifyBranchAccess, checkPermission("DELETE_PROJECT"), projectController.deleteProject)

// User-Specific Arena Scheduler Routes
router.route("/:projectId/schedule").post(verifyJWT, verifyBranchAccess, projectController.scheduleArena)
router.route("/:projectId/schedule").get(verifyJWT, verifyBranchAccess, projectController.getArenaSchedule)
router.route("/:projectId/schedule").delete(verifyJWT, verifyBranchAccess, projectController.resetArenaSchedule)

export default router;