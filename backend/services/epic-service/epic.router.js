import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import epicController from './epic.controller.js';

const router = Router();

router.route("/create-epic").post(verifyJWT, epicController.createEpic);
router.route("/update-epic/:epicId").put(verifyJWT, epicController.updateEpic);
router.route("/get-epics/:projectId").get(verifyJWT, epicController.getEpicsByProject);
router.route("/delete-epic/:epicId").delete(verifyJWT, epicController.deleteEpic);

export default router;
