import { Router } from "express";
import { runCode, submitCode } from "./judge.controller.js";

const router = Router();

// Run Code API
router.post("/run", runCode);

// Submit Code API
router.post("/submit", submitCode);

export default router;
