import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import at from "./activity.controller.js";

const router = Router()

router.route("/create-activity").post(verifyJWT, at.createActivity)
router.route("/update-activity/:activityId").put(verifyJWT, at.updateActivity)
router.route("/get-activity/:activityId").get(verifyJWT, at.getActivityById)
router.route("/get-all-activities").post(verifyJWT, at.getAllActivities);
router.route("/delete-activity/:activityId").delete(verifyJWT, at.deleteActivity)
router.route("/completed-activity/:activityId").patch(verifyJWT, at.completedActivity)

export default router