import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import bg from "./bug.controller.js";

const router = Router();

router.route("/create-bug").post(verifyJWT, bg.createBug);
router.route("/update-bug/:bugId").put(verifyJWT, bg.updateBug);
router.route("/get-bug/:bugId").get(verifyJWT, bg.getBugById);
router.route("/get-all-bugs").post(verifyJWT, bg.getAllBugs);
router.route("/delete-bug/:bugId").delete(verifyJWT, bg.deleteBug);
router.route("/update-bug-log/:bugId").patch(verifyJWT, bg.updateBugLog)

export default router;