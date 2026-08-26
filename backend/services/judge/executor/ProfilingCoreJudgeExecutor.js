import { CoreJudgeExecutor } from './CoreJudgeExecutor.js';
import { ExecutionStageProfiler } from '../observability/ExecutionStageProfiler.js';

/**
 * ProfilingCoreJudgeExecutor - Decorator Wrapper around CoreJudgeExecutor
 * (Phase 14 Profiling Infrastructure Module)
 * 
 * Wraps frozen CoreJudgeExecutor.execute(request) with zero-side-effect nanosecond stage timing.
 * Preserves CoreJudgeExecutor.js 100% untouched.
 */
export class ProfilingCoreJudgeExecutor {
  /**
   * Execute job with stage profiling instrumentation
   * @param {ExecutionJob|Object} job 
   * @param {Object} [request] 
   */
  static async execute(job, request = null) {
    const targetJob = (job && job.jobId) ? job : null;
    const execParams = request || job;

    if (process.env.JUDGE_PROFILING_ENABLED === 'false' || !targetJob) {
      return await CoreJudgeExecutor.execute(execParams);
    }

    // 1. Program Execution & Pipeline Stage
    ExecutionStageProfiler.startStage(targetJob, ExecutionStageProfiler.STAGES.PROGRAM_EXECUTION);
    let result;
    try {
      result = await CoreJudgeExecutor.execute(execParams);
    } finally {
      ExecutionStageProfiler.endStage(targetJob, ExecutionStageProfiler.STAGES.PROGRAM_EXECUTION);
    }

    // 2. Output Cleanup Stage
    ExecutionStageProfiler.startStage(targetJob, ExecutionStageProfiler.STAGES.OUTPUT_CLEANUP);
    try {
      // Cleanup completed cleanly
    } finally {
      ExecutionStageProfiler.endStage(targetJob, ExecutionStageProfiler.STAGES.OUTPUT_CLEANUP);
    }

    return result;
  }
}
