import assert from 'assert';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { ExecutionStageProfiler } from '../services/judge/observability/ExecutionStageProfiler.js';
import { ProfilingCoreJudgeExecutor } from '../services/judge/executor/ProfilingCoreJudgeExecutor.js';
import { CompilationArtifactCache } from '../services/judge/orchestration/capacity/CompilationArtifactCache.js';
import { WarmContainerPool } from '../services/judge/orchestration/sandbox/WarmContainerPool.js';
import { gVisorSandboxDriver } from '../services/judge/orchestration/sandbox/gVisorSandboxDriver.js';
import { SandboxOrchestrator } from '../services/judge/sandbox/SandboxOrchestrator.js';

console.log("===============================================================================");
console.log("  PHASE 14: ADVANCED OPTIMIZATION & MICRO-KERNEL HARDENING TEST SUITE");
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
    // 1. EXECUTION STAGE PROFILER & DECORATOR WRAPPER
    // -------------------------------------------------------------------------
    console.log("[1. ExecutionStageProfiler & Decorator Wrapper]");
    process.env.JUDGE_PROFILING_ENABLED = 'true';

    const job = new ExecutionJob({ jobId: 'prof_test_1', userId: 'user1', language: 'python', code: 'print("hello")' });

    ExecutionStageProfiler.startStage(job, ExecutionStageProfiler.STAGES.GATEWAY_INGESTION);
    await new Promise(r => setTimeout(r, 5));
    ExecutionStageProfiler.endStage(job, ExecutionStageProfiler.STAGES.GATEWAY_INGESTION);

    const summary = ExecutionStageProfiler.getSummary(job);
    assertTest("Profiler: Captures GatewayIngestion stage timing", summary.stages[ExecutionStageProfiler.STAGES.GATEWAY_INGESTION] > 0);
    assertTest("Profiler: Calculates positive totalMs execution duration", summary.totalMs > 0);

    const execResult = await ProfilingCoreJudgeExecutor.execute(job, {
      language: 'python',
      code: 'print("hello")',
      testCases: []
    });

    assertTest("Profiling Decorator Wrapper: Executes job successfully and preserves CoreJudgeExecutor contract", execResult !== null && typeof execResult === 'object');
    assertTest("Profiling Decorator Wrapper: Captures ProgramExecution stage timing on job", job.profilingData.stages[ExecutionStageProfiler.STAGES.PROGRAM_EXECUTION] > 0);

    // -------------------------------------------------------------------------
    // 2. COMPILATION ARTIFACT CACHE (SINGLE-FLIGHT & CHECKSUM VERIFICATION)
    // -------------------------------------------------------------------------
    console.log("\n[2. CompilationArtifactCache Identity, Single-Flight & Checksum Verification]");
    process.env.JUDGE_COMPILATION_CACHE_ENABLED = 'true';

    const cache = new CompilationArtifactCache({ maxSizeMb: 1, ttlHours: 1 });
    cache.clear();

    const key1 = cache.generateCacheKey({ code: 'int main() {}', language: 'cpp' });
    const key2 = cache.generateCacheKey({ code: 'int main() {}', language: 'cpp' });
    const keyDiff = cache.generateCacheKey({ code: 'int main() { return 1; }', language: 'cpp' });

    assertTest("CompilationCache Key: Generates identical sha256 key for identical code & parameters", key1 === key2);
    assertTest("CompilationCache Key: Generates distinct sha256 key for modified code", key1 !== keyDiff);

    // Single-Flight Mutex Execution Test
    let compileCount = 0;
    const compileTask = () => cache.executeSingleFlight(key1, async () => {
      compileCount++;
      await new Promise(r => setTimeout(r, 50));
      return Buffer.from('mock_binary_code');
    });

    const [resA, resB] = await Promise.all([compileTask(), compileTask()]);
    assertTest("CompilationCache Single-Flight: Parallel compilation calls execute underlying compiler exactly once", compileCount === 1);
    assertTest("CompilationCache Single-Flight: Parallel callers receive identical binary buffer", resA.toString() === resB.toString());

    // Storage & Checksum Verification
    await cache.storeArtifact(key1, Buffer.from('mock_compiled_object_bytes'));
    const cachedItem = await cache.getArtifact(key1);
    assertTest("CompilationCache Store/Get: Retrieves stored binary artifact successfully", cachedItem && cachedItem.buffer.toString() === 'mock_compiled_object_bytes');

    // Corrupted Checksum Test
    const corruptedMeta = cache.inMemoryMeta.get(key1);
    corruptedMeta.checksum = 'invalid_corrupted_checksum_hash';
    const corruptedResult = await cache.getArtifact(key1);
    assertTest("CompilationCache Security: Checksum mismatch evicts corrupted artifact and returns null", corruptedResult === null);

    cache.clear();

    // -------------------------------------------------------------------------
    // 3. WARM CONTAINER POOL & PROCESS-TREE DESTRUCTION GATE
    // -------------------------------------------------------------------------
    console.log("\n[3. WarmContainerPool Lifecycle & Baseline Process-Tree Destruction Gate]");
    process.env.JUDGE_WARM_POOLS_ENABLED = 'true';

    const warmPool = new WarmContainerPool({ minWarmPerLang: 2 });
    await warmPool.synchronizeCapacity(10);

    const warmMetrics = warmPool.getMetrics();
    assertTest("WarmContainerPool: Pre-forks minWarmPerLang warm container pool", warmMetrics.warmContainers >= 2);

    const acquired = await warmPool.acquireContainer('python', 'runc');
    assertTest("WarmContainerPool Acquire: Transition container state to LEASED", acquired && acquired.state === 'LEASED');

    // Release Healthy Container
    await warmPool.releaseContainer(acquired, { activePids: [1, 'node'], filesystemTainted: false });
    assertTest("WarmContainerPool Sanitization: Healthy container sanitized and returned to WARM state", acquired.state === 'WARM');

    // Release Contaminated Process-Tree Container
    const acquired2 = await warmPool.acquireContainer('python', 'runc');
    await warmPool.releaseContainer(acquired2, { activePids: [1, 9999], processContaminated: true });
    assertTest("WarmContainerPool Destruction Gate: Process-tree contaminated container transitions to DESTROYED state", acquired2.state === 'DESTROYED');

    // -------------------------------------------------------------------------
    // 4. GVISOR SUB-KERNEL VIRTUALIZATION DRIVER & STRICT SECURITY GATE
    // -------------------------------------------------------------------------
    console.log("\n[4. gVisorSandboxDriver & Strict Security Gate]");
    process.env.JUDGE_GVISOR_ENABLED = 'true';
    process.env.JUDGE_STRICT_GVISOR_REQUIRED = 'true';

    const gvisorDriver = new gVisorSandboxDriver({ strictMode: true });
    const gvisorResult = await gvisorDriver.execute({ language: 'python' });

    assertTest("gVisor Driver: Strict mode returns SANDBOX_UNAVAILABLE when runsc runtime is missing on host", gvisorResult.status === 'SANDBOX_UNAVAILABLE');
    assertTest("gVisor Driver: Strict mode prevents any silent security downgrade to unisolated execution", gvisorResult.verdict === 'SANDBOX_UNAVAILABLE');

    // Reset env flags
    process.env.JUDGE_STRICT_GVISOR_REQUIRED = 'false';

  } catch (err) {
    console.error("FATAL PHASE 14 TEST ERROR:", err);
    failCount++;
  } finally {
    console.log("\n===============================================================================");
    console.log(`  PHASE 14 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
    console.log("===============================================================================\n");
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runTests();
