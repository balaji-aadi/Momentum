import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import fileController from "./file.controller.js";

const router = Router();

router.route("/upload-file").post(fileController.uploadFiles)
router.route("/get-file/:filename").get(fileController.getFile)


export default router;