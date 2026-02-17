import { Router } from "express";
import { verifyJWT } from "../../../middlewares/auth.middleware.js";
import mdboard from "./dashboard.controller.js";

const router = Router();

router.route("/project-Statistics").post(verifyJWT, mdboard.projectStatistics);
router.route("/team-Statistics").post(verifyJWT, mdboard.teamStatistics)
router.route("/user-Statistics").post(verifyJWT, mdboard.userStatistics)
router.route("/task-deliverable").post(verifyJWT, mdboard.todayTaskDeliverables)
router.route("/developer-Statistics").post(verifyJWT, mdboard.developerStatistics)


export default router