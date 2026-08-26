import { Router } from "express";
import { runCode, submitCode, getJobStatus, getMetrics } from "./judge.controller.js";

const router = Router();

// Run Code API
router.post("/run", runCode);

// Submit Code API
router.post("/submit", submitCode);

// Async Execution Job Status Polling API (Phase 11)
router.get("/jobs/:jobId", getJobStatus);

// Internal Prometheus Metrics API (Phase 12)
router.get("/metrics", getMetrics);

export default router;
