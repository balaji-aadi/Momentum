import assert from 'assert';
import http from 'http';
import express from 'express';
import { DockerContainerSandboxDriver } from '../services/judge/orchestration/sandbox/DockerContainerSandboxDriver.js';
import { WorkerLeaseManager } from '../services/judge/orchestration/WorkerLeaseManager.js';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { MemoryExecutionQueue } from '../services/judge/orchestration/queues/MemoryExecutionQueue.js';
import { JobStateMachine } from '../services/judge/orchestration/JobStateMachine.js';
import { JudgeLogger } from '../services/judge/observability/JudgeLogger.js';
import { JudgeMetricsCollector } from '../services/judge/observability/JudgeMetricsCollector.js';
import judgeRouter from '../services/judge-service/judge.router.js';

console.log("===============================================================================");
console.log("  PHASE 12: SECURITY, RELIABILITY & OBSERVABILITY AUTOMATED TEST SUITE");
console.log("===============================================================================\n");

let passCount = 0;
let failCount = 0;

function assertTest(name, condition, extraInfo = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${extraInfo}`);
    failCount++;
  }
}

async function runTests() {
  try {
    // -------------------------------------------------------------------------
    // 1. TIER-2 OCI CONTAINER SANDBOX & STRICT FALLBACK POLICY
    // -------------------------------------------------------------------------
    console.log("[1. Tier-2 OCI Container Sandbox & Fallback Policy]");
    const sandboxDriver = new DockerContainerSandboxDriver();

    const isDockerAvailable = sandboxDriver.checkDockerAvailability();
    console.log(`  [Environment Status] Docker CLI Daemon Available: ${isDockerAvailable ? 'YES' : 'NO'}`);

    // Strict Mode Enforcement Test
    process.env.JUDGE_STRICT_SANDBOX_REQUIRED = 'true';
    const strictRes = await sandboxDriver.execute({
      language: 'python',
      sourceCode: 'print(1)',
      strictSandboxMode: true
    });

    if (!isDockerAvailable) {
      assertTest("Strict Sandbox Mode: Returns SANDBOX_UNAVAILABLE when Docker daemon is offline", strictRes.status === 'SANDBOX_UNAVAILABLE');
    } else {
      assertTest("Strict Sandbox Mode: Executes inside Tier-2 container when Docker is online", strictRes.status === 'PASSED' || strictRes.status === 'SUCCESS');
    }
    process.env.JUDGE_STRICT_SANDBOX_REQUIRED = 'false';

    // -------------------------------------------------------------------------
    // 2. FENCED JOB LEASE OWNERSHIP & WORKER CRASH RECOVERY
    // -------------------------------------------------------------------------
    console.log("\n[2. Fenced Job Lease Ownership & Crash Recovery]");

    const job = new ExecutionJob({ jobId: 'job_lease_test_001', executionType: 'SUBMIT' });
    const leaseMeta = WorkerLeaseManager.issueLease(job, 'worker_alpha', 100); // 100ms short TTL for testing

    assertTest("Fenced Lease: Issues unique UUIDv4 fencing token (leaseId)", typeof job.leaseId === 'string' && job.leaseId.startsWith('lease_'));
    assertTest("Fenced Lease: Assigns workerId ownership", job.workerId === 'worker_alpha');

    // Lease Verification
    const isLeaseValid = WorkerLeaseManager.verifyLease(job, job.leaseId);
    assertTest("Fenced Lease: Unexpired lease verifyLease returns true", isLeaseValid === true);

    const isWrongLeaseValid = WorkerLeaseManager.verifyLease(job, 'lease_fake_invalid_token');
    assertTest("Fenced Lease: Mismatched leaseId fencing token returns false", isWrongLeaseValid === false);

    // Wait for lease expiration
    await new Promise(r => setTimeout(r, 150));

    const isExpiredLeaseValid = WorkerLeaseManager.verifyLease(job, job.leaseId);
    assertTest("Fenced Lease: Expired lease verifyLease returns false", isExpiredLeaseValid === false);

    // Expired Lease Reclaiming Test
    const queue = new MemoryExecutionQueue();
    const staleJob = new ExecutionJob({ jobId: 'job_stale_99', executionType: 'RUN' });
    await queue.enqueue(staleJob);
    await queue.dequeue('worker_dead');
    staleJob.leaseExpiresAt = new Date(Date.now() - 500).toISOString(); // Set expired timestamp

    const reclaimed = await WorkerLeaseManager.reclaimExpiredJobs(queue);
    assertTest("Worker Crash Recovery: Reclaims expired lease job ID", reclaimed.includes('job_stale_99'));

    const reclaimedJobState = await queue.getJob('job_stale_99');
    assertTest("Worker Crash Recovery: Reclaimed job state transitions to QUEUED for next worker", reclaimedJobState && reclaimedJobState.state === 'QUEUED');

    // -------------------------------------------------------------------------
    // 3. STRUCTURED JSON LOGGING & PRIVACY REDACTION
    // -------------------------------------------------------------------------
    console.log("\n[3. Structured JSON Logging & Privacy Redaction]");

    const sensitiveData = {
      jobId: 'job_log_123',
      userId: 'user_456',
      code: 'import os; print("secret")',
      studentCode: 'function hack() {}',
      MONGO_URI: 'mongodb://admin:pass@host:27017',
      JWT_SECRET: 'supersecretkey123',
      testCases: [{ input: 1 }, { input: 2 }]
    };

    const sanitized = JudgeLogger.redactSensitiveData(sensitiveData);

    assertTest("Logging Privacy: Strips student source code ('code')", sanitized.code === undefined);
    assertTest("Logging Privacy: Strips student source code ('studentCode')", sanitized.studentCode === undefined);
    assertTest("Logging Privacy: Redacts MONGO_URI database credentials", sanitized.MONGO_URI === undefined);
    assertTest("Logging Privacy: Redacts JWT_SECRET security token", sanitized.JWT_SECRET === undefined);
    assertTest("Logging Privacy: Replaces testCases array with testCasesCount metric", sanitized.testCases === undefined && sanitized.testCasesCount === 2);

    // -------------------------------------------------------------------------
    // 4. SECURED PROMETHEUS METRICS & LOW-CARDINALITY POLICY
    // -------------------------------------------------------------------------
    console.log("\n[4. Secured Prometheus Metrics & Low-Cardinality Policy]");

    const metricsCollector = JudgeMetricsCollector.getInstance();
    metricsCollector.incCounter('sarthi_judge_jobs_submitted_total', {
      execution_type: 'SUBMIT',
      language: 'python',
      jobId: 'MUST_BE_REMOVED_HIGH_CARDINALITY',
      worker_id: 'MUST_BE_REMOVED_HIGH_CARDINALITY'
    });

    metricsCollector.setGauge('sarthi_judge_queue_depth', { priority: 'HIGH' }, 5);
    metricsCollector.observeHistogram('sarthi_judge_job_duration_seconds', { language: 'python', status: 'PASSED' }, 0.145);

    const promString = metricsCollector.toPrometheusString();

    assertTest("Prometheus Telemetry: Exports metric string with sarthi_judge_jobs_submitted_total", promString.includes('sarthi_judge_jobs_submitted_total'));
    assertTest("Prometheus Telemetry: Exports gauge metric sarthi_judge_queue_depth", promString.includes('sarthi_judge_queue_depth{priority="HIGH"} 5'));
    assertTest("Prometheus Telemetry: Excludes jobId from metric labels (low cardinality)", !promString.includes('jobId='));
    assertTest("Prometheus Telemetry: Excludes worker_id from metric labels (low cardinality)", !promString.includes('worker_id='));

    // -------------------------------------------------------------------------
    // 5. INTERNAL SECURED METRICS HTTP API ROUTE
    // -------------------------------------------------------------------------
    console.log("\n[5. Internal Secured Metrics HTTP API Route]");

    const app = express();
    app.use(express.json());
    app.use('/api/v1/judge', judgeRouter);

    const server = app.listen(0);
    const port = server.address().port;

    process.env.JUDGE_METRICS_TOKEN = 'secret_admin_metrics_key_777';

    // Request without auth header -> 403 Forbidden
    const unauthRes = await new Promise(res => {
      const req = http.request(`http://localhost:${port}/api/v1/judge/metrics`, { method: 'GET' }, r => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => res({ statusCode: r.statusCode, body: JSON.parse(data) }));
      });
      req.end();
    });

    assertTest("Metrics Security: Returns 403 Forbidden when authentication token is missing", unauthRes.statusCode === 403);

    // Request with valid header -> 200 OK
    const authRes = await new Promise(res => {
      const req = http.request(`http://localhost:${port}/api/v1/judge/metrics`, {
        method: 'GET',
        headers: { 'x-internal-metrics-token': 'secret_admin_metrics_key_777' }
      }, r => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => res({ statusCode: r.statusCode, body: data }));
      });
      req.end();
    });

    assertTest("Metrics Security: Returns HTTP 200 OK Prometheus string when valid token is supplied", authRes.statusCode === 200 && authRes.body.includes('sarthi_judge_queue_depth'));

    delete process.env.JUDGE_METRICS_TOKEN;
    server.close();

  } catch (err) {
    console.error("FATAL PHASE 12 TEST ERROR:", err);
    failCount++;
  } finally {
    console.log("\n===============================================================================");
    console.log(`  PHASE 12 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
    console.log("===============================================================================\n");
    if (failCount > 0) process.exit(1);
  }
}

runTests();
