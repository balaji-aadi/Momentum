import { Router } from "express";
import analyticsController from "./analytics.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { verifyBranchAccess } from "../../middlewares/branch.middleware.js";

const router = Router();

// All analytics routes require authentication
router.use(verifyJWT);
router.use(verifyBranchAccess);

router.get("/personal-stats", analyticsController.getPersonalStats);

router.get("/team-stats", analyticsController.getTeamStats);
router.get("/project-health", analyticsController.getProjectHealth);
router.get("/member-stats/:userId", analyticsController.getMemberStats);
router.get("/day-details", analyticsController.getDayDetails);
router.post("/sync", analyticsController.syncData);

export default router;
