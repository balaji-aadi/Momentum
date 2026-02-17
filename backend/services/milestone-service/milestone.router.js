import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import milestoneController from './milestone.controller.js';

const router = Router();

router.route("/create-milestone/:projectId").post(verifyJWT, milestoneController.createMilestone)
router.route("/update-milestone/:milestoneId").put(verifyJWT, milestoneController.updateMilestone)
router.route("/find-milestone/:milestoneId").get(verifyJWT, milestoneController.getMilestonebyId)
router.route("/find-all-milestone").post(verifyJWT, milestoneController.getAllMilestone)
router.route("/delete-milestone/:milestoneId").delete(verifyJWT, milestoneController.deleteMilestone)


export default router;