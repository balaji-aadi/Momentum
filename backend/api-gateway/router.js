import { Router } from "express";
import userRouter from "../services/user-service/user.router.js";
import roleRouter from "../services/role-service/role.router.js";
import projectRouter from "../services/project-service/project.router.js";
import taskRouter from "../services/task-service/task.router.js";
import bugRouter from "../services/bug-service/bug.router.js";
import mdboardRouter from "../services/dashboard-service/main dashboard/dashboard.router.js";
import activityRouter from "../services/activity-service/activity.router.js";
import testtaskRouter from "../services/testTask-services/testerTask.router.js";
import tboardRouter from "../services/dashboard-service/test dashboard/dashboard.router.js";
import fileRouter from "../services/file-service/file.router.js";
import notifyRouter from "../services/notification-service/notification.router.js"
import milestoneRouter from "../services/milestone-service/milestone.router.js"
import epicRouter from "../services/epic-service/epic.router.js";
import sprintRouter from "../routes/sprint.routes.js";
import webhookRouter from "../routes/webhook.routes.js";


const router = Router();

router.use("/user", userRouter);
router.use("/role", roleRouter);
router.use("/project", projectRouter);
router.use("/task", taskRouter);
router.use("/bug", bugRouter);
router.use("/mdashboard", mdboardRouter)
router.use("/activity", activityRouter)
router.use("/testtask", testtaskRouter)
router.use("/tdashboard", tboardRouter)
router.use("/notify", notifyRouter)
router.use("/file", fileRouter)
router.use("/milestone", milestoneRouter)
router.use("/epic", epicRouter);
router.use("/sprint", sprintRouter);
router.use("/webhook", webhookRouter);

export default router;
