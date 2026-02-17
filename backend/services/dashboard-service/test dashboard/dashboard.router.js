import { Router } from "express";
import { verifyJWT } from "../../../middlewares/auth.middleware.js";
import tdboard from "./dashboard.controller.js";

const router = Router();

router.route("/test-Statistics").post(verifyJWT, tdboard.testStatistics);
router.route("/bug-Statistics").post(verifyJWT, tdboard.bugStatistics);


export default router