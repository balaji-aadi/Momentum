import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import nt from "./notification.controller.js";

const router = Router();

router.route("/get-all-notification").post(verifyJWT, nt.getAllNotification)
router.route("/update-notification/:id").put(verifyJWT, nt.updateNotification)
router.route("/mark-all").put(verifyJWT, nt.markAllNotifications)


export default router