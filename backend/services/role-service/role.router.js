import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import roleController from './role.controller.js';

const router = Router();

router.route("/create-role").post(verifyJWT, roleController.createRole)
router.route("/update-role/:roleId").put(verifyJWT, roleController.updateRole)
router.route("/get-role-by-id/:roleId").get(verifyJWT, roleController.getRoleById)
router.route("/get-all-role").get(roleController.getAllRole)


export default router;