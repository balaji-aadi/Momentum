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
import analyticsRouter from "../services/analytics-service/analytics.router.js";
import webhookRouter from "../routes/webhook.routes.js";
import dailyAccountabilityRouter from "../services/dailyAccountability-service/dailyAccountability.router.js";
import focusRouter from "../services/focus-service/focus.router.js";
import branchRouter from "../services/branch-service/branch.router.js";
import subscriptionRouter from "../services/subscription-service/subscription.router.js";
import noteRouter from "../services/note-service/note.router.js";
import problemRouter from "../services/problem-service/problem.router.js";
import judgeRouter from "../services/judge-service/judge.router.js";

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
router.use("/analytics", analyticsRouter);
router.use("/webhook", webhookRouter);
router.use("/daily-accountability", dailyAccountabilityRouter);
router.use("/focus", focusRouter);
router.use("/branch", branchRouter);
router.use("/subscription", subscriptionRouter);
router.use("/note", noteRouter);
router.use("/problem", problemRouter);
router.use("/judge", judgeRouter);

export default router;
