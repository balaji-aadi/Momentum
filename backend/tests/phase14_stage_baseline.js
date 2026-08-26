import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { FairShareQueueAdapter } from '../services/judge/orchestration/scheduling/FairShareQueueAdapter.js';
import { FairShareScheduler } from '../services/judge/orchestration/scheduling/FairShareScheduler.js';
import { InProcessWorkerPoolDriver } from '../services/judge/orchestration/scaling/drivers/InProcessWorkerPoolDriver.js';
import { WorkerAutoScaler } from '../services/judge/orchestration/scaling/WorkerAutoScaler.js';
import { ExecutionStageProfiler } from '../services/judge/observability/ExecutionStageProfiler.js';

console.log("===============================================================================");
console.log("  STAGE 14.1 — STAGE-BY-STAGE BASELINE LATENCY PROFILING (UNOPTIMIZED)");
console.log("===============================================================================\n");

process.env.JUDGE_PROFILING_ENABLED = 'true';
process.env.JUDGE_COMPILATION_CACHE_ENABLED = 'false';
process.env.JUDGE_WARM_POOLS_ENABLED = 'false';
process.env.JUDGE_GVISOR_ENABLED = 'false';

async function runBaselineProfiling() {
  const queue = new FairShareQueueAdapter();
  const poolDriver = new InProcessWorkerPoolDriver({ queue, workerConfig: { maxConcurrency: 5 } });

  await poolDriver.scaleTo(2); // Start with 2 workers

  const autoScaler = new WorkerAutoScaler({
    workerDriver: poolDriver,
    queue,
    config: { minWorkers: 2, maxWorkers: 10 }
  });

  const totalRequests = 200; // Profile 200 baseline jobs
  const tenants = ['tenant_1', 'tenant_2', 'tenant_3', 'tenant_4', 'tenant_5'];

  const jobsSubmitted = [];
  const startTime = Date.now();

  for (let i = 0; i < totalRequests; i++) {
    const tenantId = tenants[i % tenants.length];
    const lang = i % 2 === 0 ? 'python' : 'cpp';
    const job = new ExecutionJob({
      jobId: `prof_job_${i}`,
      userId: tenantId,
      executionType: 'SUBMIT',
      language: lang,
      priority: 'HIGH',
      code: lang === 'cpp' ? '#include <iostream>\nint main() { return 0; }' : 'print(1)'
    });

    ExecutionStageProfiler.startStage(job, ExecutionStageProfiler.STAGES.GATEWAY_INGESTION);
    ExecutionStageProfiler.endStage(job, ExecutionStageProfiler.STAGES.GATEWAY_INGESTION);

    ExecutionStageProfiler.startStage(job, ExecutionStageProfiler.STAGES.QUEUE_ENQUEUE);
    await queue.enqueue(job);
    ExecutionStageProfiler.endStage(job, ExecutionStageProfiler.STAGES.QUEUE_ENQUEUE);

    jobsSubmitted.push(job.jobId);
  }

  // Wait for all jobs to complete processing
  for (let cycle = 0; cycle < 500; cycle++) {
    await new Promise(r => setTimeout(r, 20));
    const metrics = await queue.getMetrics();
    if (cycle % 10 === 0) await autoScaler.evaluateScalingCycle();
    if (metrics.queued === 0 && metrics.active === 0) break;
  }

  await poolDriver.scaleTo(0);

  // Aggregate Stage Timings across all completed jobs
  const stageAggregates = {};
  let totalJobsProfiled = 0;

  for (const jobId of jobsSubmitted) {
    const job = await queue.getJob(jobId);
    if (job && job.profilingData && job.profilingData.stages) {
      totalJobsProfiled++;
      for (const [stage, ms] of Object.entries(job.profilingData.stages)) {
        stageAggregates[stage] = (stageAggregates[stage] || 0) + ms;
      }
    }
  }

  console.log(`  Total Jobs Profiled: ${totalJobsProfiled} / ${totalRequests}`);
  console.log(`\n  --- EMPIRICAL STAGE-BY-STAGE LATENCY BREAKDOWN ---`);
  
  let grandTotalMs = 0;
  for (const ms of Object.values(stageAggregates)) grandTotalMs += ms;

  for (const [stage, totalMs] of Object.entries(stageAggregates)) {
    const avgMs = (totalMs / totalJobsProfiled).toFixed(3);
    const pct = grandTotalMs > 0 ? ((totalMs / grandTotalMs) * 100).toFixed(1) : "0.0";
    console.log(`  - ${stage.padEnd(28)}: Avg ${avgMs.padStart(8)} ms per job (${pct}%)`);
  }

  console.log(`\n===============================================================================\n`);
}

runBaselineProfiling();
