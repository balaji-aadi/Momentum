import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import testtaskController from "./testerTask.controller.js";

const router = Router();

router.route("/create-testtask").post(verifyJWT, testtaskController.createTestTask);
router.route("/update-testtask/:testCaseId").put(verifyJWT, testtaskController.updateTestTask);
router.route("/get-testtasks/:testCaseId").get(verifyJWT, testtaskController.getTestTaskById);
router.route("/get-all-testtasks").post(verifyJWT, testtaskController.getallTestTasks);
router.route("/delete-testtask/:testCaseId").delete(verifyJWT, testtaskController.deleteTestTask);
router.route("/update-testtask-log/:testCaseId").patch(verifyJWT, testtaskController.updatetesttaskLog);
// router.route("/get-all-testers").get(verifyJWT, testtaskController.getAllTesters)

export default router;