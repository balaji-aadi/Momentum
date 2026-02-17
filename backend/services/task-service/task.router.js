import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import taskController from "./task.controller.js";
import taskImports from "./taskimport.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-task").post(verifyJWT, taskController.createTask);
router.route("/update-task/:taskId").put(verifyJWT, taskController.updateTask);
router.route("/get-tasks/:taskId").get(verifyJWT, taskController.getTaskById);
router.route("/get-all-tasks").post(verifyJWT, taskController.getallTasks);
router.route("/get-alltask-free").post(verifyJWT, taskController.getallTasksfree);
router.route("/delete-task/:taskId").delete(verifyJWT, taskController.deleteTask);
router.route("/update-task-log/:taskId").patch(verifyJWT, taskController.updatetaskLog);
router.route("/task-import").post(verifyJWT, upload.single("file"), taskImports);
router.route("/deletemilestone/:milestoneId").post(verifyJWT, taskController.deletemilestone)

export default router;
