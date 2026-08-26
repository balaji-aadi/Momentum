/**
 * ExecutionStageProfiler - Stage-by-Stage Latency Profiler
 * (Phase 14 Observability & Profiling Module)
 * 
 * Measures discrete execution stages using process.hrtime.bigint() nanosecond precision.
 * Attaches stage timing profiles to ExecutionJob context for bottleneck analysis.
 */
export class ExecutionStageProfiler {
  static STAGES = {
    GATEWAY_INGESTION: 'GatewayIngestion',
    RATE_LIMITING_CHECK: 'RateLimitingCheck',
    BACKPRESSURE_EVALUATION: 'BackpressureEvaluation',
    QUEUE_ENQUEUE: 'QueueEnqueue',
    FAIRSHARE_DEQUEUE: 'FairShareDequeue',
    WORKER_LEASE_ACQUISITION: 'WorkerLeaseAcquisition',
    CONTAINER_STARTUP: 'ContainerStartup',
    WORKSPACE_SETUP: 'WorkspaceSetup',
    COMPILATION: 'Compilation',
    PROGRAM_EXECUTION: 'ProgramExecution',
    OUTPUT_CLEANUP: 'OutputCleanup'
  };

  static startStage(job, stageName) {
    if (!job) return null;
    if (!job.profilingData) {
      job.profilingData = {
        stages: {},
        activeTimers: {},
        startTimeNs: process.hrtime.bigint(),
        totalMs: 0
      };
    }
    job.profilingData.activeTimers[stageName] = process.hrtime.bigint();
    return job.profilingData.activeTimers[stageName];
  }

  static endStage(job, stageName) {
    if (!job || !job.profilingData || !job.profilingData.activeTimers[stageName]) return 0;

    const startNs = job.profilingData.activeTimers[stageName];
    const endNs = process.hrtime.bigint();
    const durationNs = endNs - startNs;
    const durationMs = Number(durationNs) / 1e6; // Convert nanoseconds to milliseconds

    job.profilingData.stages[stageName] = (job.profilingData.stages[stageName] || 0) + Number(durationMs.toFixed(3));
    delete job.profilingData.activeTimers[stageName];

    // Update total elapsed time
    const totalNs = endNs - job.profilingData.startTimeNs;
    job.profilingData.totalMs = Number((Number(totalNs) / 1e6).toFixed(3));

    return job.profilingData.stages[stageName];
  }

  static getSummary(job) {
    if (!job || !job.profilingData) return { totalMs: 0, stages: {} };
    return {
      totalMs: job.profilingData.totalMs,
      stages: job.profilingData.stages
    };
  }
}
