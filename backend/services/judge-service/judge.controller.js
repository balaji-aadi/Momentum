import Problem from "../../models/problem.model.js";
import { RunCodeService } from "./runCode.service.js";
import { SubmitCodeService } from "./submitCode.service.js";
import { defaultJudgeGateway } from "../judge/orchestration/JudgeGatewayService.js";
import { JudgeMetricsCollector } from "../judge/observability/JudgeMetricsCollector.js";
import { JudgeLogger } from "../judge/observability/JudgeLogger.js";
import { JudgeRateLimiter } from "../judge/orchestration/rateLimiting/JudgeRateLimiter.js";
import { BackpressureManager } from "../judge/orchestration/capacity/BackpressureManager.js";

const defaultRateLimiter = new JudgeRateLimiter();
const defaultBackpressure = new BackpressureManager();

// ==================== EXECUTE CODE (RUN API - PHASE 8, 11 & 13) ====================
export const runCode = async (req, res) => {
  try {
    const { problemId, language = 'javascript', code, customTestCases } = req.body;
    const clientKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || null;
    const correlationId = req.headers['x-correlation-id'] || null;
    const traceId = req.headers['x-trace-id'] || null;
    const userId = req.user?._id || req.user?.id || req.body.userId || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code parameter cannot be empty."
      });
    }

    // Phase 13 Step 1: Rate Limiting Check
    const rateLimitRes = await defaultRateLimiter.checkLimit({ userId, ipAddress, executionType: 'RUN' });
    if (!rateLimitRes.allowed) {
      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_rate_limit_rejections_total', { execution_type: 'RUN' });
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for RUN execution requests.',
        retryAfterSeconds: rateLimitRes.retryAfterSeconds
      });
    }

    // Phase 13 Step 2: Backpressure Check
    const healthRes = await defaultBackpressure.evaluateHealth();
    if (healthRes.state === 'SHED') {
      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_backpressure_shed_total', { state: 'SHED' });
      res.setHeader('Retry-After', healthRes.retryAfterSeconds || 5);
      return res.status(503).json({
        success: false,
        error: 'System capacity overloaded. Early load shedding initiated.',
        retryAfterSeconds: healthRes.retryAfterSeconds || 5
      });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = typeof problemId === 'string' && problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: String(problemId).toLowerCase() };
      problem = await Problem.findOne(query);
    }

    // Feature Flag Check: Async Orchestration vs Synchronous Fallback
    const isAsyncMode = process.env.JUDGE_ASYNC_ORCHESTRATION_ENABLED === 'true';

    if (isAsyncMode) {
      const gatewayRes = await defaultJudgeGateway.submitJob({
        problem,
        language,
        code,
        customTestCases,
        userId,
        executionType: 'RUN',
        clientKey,
        correlationId,
        traceId
      });

      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_jobs_submitted_total', { execution_type: 'RUN', language });
      JudgeLogger.info('JOB_ACCEPTED_ASYNC', { jobId: gatewayRes.jobId, correlationId, traceId, executionType: 'RUN', language });

      return res.status(202).json({
        success: true,
        message: `Run execution job accepted with status: ${gatewayRes.state}`,
        data: gatewayRes
      });
    }

    // Synchronous execution fallback (Default)
    const runResult = await RunCodeService.run({
      problem,
      language,
      code,
      customTestCases
    });

    JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_jobs_completed_total', { verdict: runResult.verdict, status: runResult.status });

    return res.status(200).json({
      success: runResult.success,
      message: `Execution completed with status: ${runResult.status}`,
      data: runResult
    });
  } catch (error) {
    JudgeLogger.error("RUN_CODE_API_ERROR", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute code."
    });
  }
};

// ==================== SUBMIT CODE (SUBMIT API - PHASE 9, 11 & 13) ====================
export const submitCode = async (req, res) => {
  try {
    const { problemId, language = 'javascript', code } = req.body;
    const userId = req.user?._id || req.user?.id || req.body.userId || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const clientKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || null;
    const correlationId = req.headers['x-correlation-id'] || null;
    const traceId = req.headers['x-trace-id'] || null;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code parameter cannot be empty."
      });
    }

    // Phase 13 Step 1: Rate Limiting Check
    const rateLimitRes = await defaultRateLimiter.checkLimit({ userId, ipAddress, executionType: 'SUBMIT' });
    if (!rateLimitRes.allowed) {
      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_rate_limit_rejections_total', { execution_type: 'SUBMIT' });
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for SUBMIT requests.',
        retryAfterSeconds: rateLimitRes.retryAfterSeconds
      });
    }

    // Phase 13 Step 2: Backpressure Check
    const healthRes = await defaultBackpressure.evaluateHealth();
    if (healthRes.state === 'SHED') {
      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_backpressure_shed_total', { state: 'SHED' });
      res.setHeader('Retry-After', healthRes.retryAfterSeconds || 5);
      return res.status(503).json({
        success: false,
        error: 'System capacity overloaded. Early load shedding initiated.',
        retryAfterSeconds: healthRes.retryAfterSeconds || 5
      });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = typeof problemId === 'string' && problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: String(problemId).toLowerCase() };
      problem = await Problem.findOne(query);
    }

    // Feature Flag Check: Async Orchestration vs Synchronous Fallback
    const isAsyncMode = process.env.JUDGE_ASYNC_ORCHESTRATION_ENABLED === 'true';

    if (isAsyncMode) {
      const gatewayRes = await defaultJudgeGateway.submitJob({
        problem,
        language,
        code,
        userId,
        executionType: 'SUBMIT',
        clientKey,
        correlationId,
        traceId
      });

      JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_jobs_submitted_total', { execution_type: 'SUBMIT', language });
      JudgeLogger.info('SUBMISSION_ACCEPTED_ASYNC', { jobId: gatewayRes.jobId, correlationId, traceId, executionType: 'SUBMIT', language });

      return res.status(202).json({
        success: true,
        message: `Submission job accepted with status: ${gatewayRes.state}`,
        data: gatewayRes
      });
    }

    // Synchronous execution fallback (Default)
    const submitResult = await SubmitCodeService.submit({
      problem,
      language,
      code,
      userId
    });

    JudgeMetricsCollector.getInstance().incCounter('sarthi_judge_jobs_completed_total', { verdict: submitResult.verdict, status: submitResult.status });

    return res.status(200).json({
      success: submitResult.success,
      message: `Submission evaluated with verdict: ${submitResult.verdict}`,
      data: submitResult
    });
  } catch (error) {
    JudgeLogger.error("SUBMIT_CODE_API_ERROR", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process submission."
    });
  }
};

// ==================== GET JOB STATUS (PHASE 11 ASYNC POLLING) ====================
export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId parameter is required."
      });
    }

    const jobStatus = await defaultJudgeGateway.getJobStatus(jobId);
    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        message: `Execution job '${jobId}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Job status: ${jobStatus.state}`,
      data: jobStatus
    });
  } catch (error) {
    console.error("Get Job Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job status."
    });
  }
};

// ==================== GET PROMETHEUS METRICS (PHASE 12 OBSERVABILITY) ====================
export const getMetrics = async (req, res) => {
  try {
    const requiredToken = process.env.JUDGE_METRICS_TOKEN;
    if (requiredToken) {
      const headerToken = req.headers['x-internal-metrics-token'];
      if (headerToken !== requiredToken) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Invalid internal metrics authorization token'
        });
      }
    }

    const prometheusData = JudgeMetricsCollector.getInstance().toPrometheusString();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    return res.status(200).send(prometheusData);
  } catch (error) {
    console.error("Get Metrics API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to export metrics."
    });
  }
};
