import { Router } from "express";
import analyticsController from "./analytics.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// All analytics routes require authentication
router.use(verifyJWT);

router.get("/personal-stats", analyticsController.getPersonalStats);

router.get("/team-stats", analyticsController.getTeamStats);
router.get("/project-health", analyticsController.getProjectHealth);
router.get("/member-stats/:userId", analyticsController.getMemberStats);
router.post("/sync", analyticsController.syncData);

export default router;
