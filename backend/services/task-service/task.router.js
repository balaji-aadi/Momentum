import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/rbac.middleware.js";
import { canUpdateTask } from "../../middlewares/resource.middleware.js";
import taskController from "./task.controller.js";
import taskImports from "./taskimport.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-task").post(verifyJWT, checkPermission("CREATE_TASK"), taskController.createTask);
router.route("/get-last-created").get(verifyJWT, taskController.getLastCreatedTask);
router.route("/update-task/:taskId").put(verifyJWT, canUpdateTask, taskController.updateTask);
router.route("/get-tasks/:taskId").get(verifyJWT, checkPermission(["VIEW_TASK", "VIEW_ASSIGNED_TASK"]), taskController.getTaskById);
router.route("/get-all-tasks").post(verifyJWT, taskController.getallTasks);
router.route("/get-alltask-free").post(verifyJWT, checkPermission("VIEW_TASK"), taskController.getallTasksfree);
router.route("/delete-task/:taskId").delete(verifyJWT, checkPermission("DELETE_TASK"), taskController.deleteTask);
router.route("/update-task-log/:taskId").patch(verifyJWT, canUpdateTask, taskController.updatetaskLog);
router.route("/task-import").post(verifyJWT, checkPermission("CREATE_TASK"), upload.single("file"), taskImports);
router.route("/deletemilestone/:milestoneId").post(verifyJWT, checkPermission("DELETE_MILESTONE"), taskController.deletemilestone)

export default router;
