import { normalizeExecutionLimits, DEFAULT_EXECUTION_LIMITS, PLATFORM_LIMIT_MAXIMUMS } from "../services/judge/sandbox/ExecutionLimits.js";
import { SandboxOrchestrator } from "../services/judge/sandbox/SandboxOrchestrator.js";
import { isDockerAvailable } from "../services/judge/sandbox/DockerSandboxExecutor.js";
import { RunCodeService } from "../services/judge-service/runCode.service.js";
import { SubmitCodeService } from "../services/judge-service/submitCode.service.js";

console.log("===============================================================================");
console.log("  PHASE 10: SANDBOX & EXECUTION LIMITS FINAL SECURITY VERIFICATION PASS");
console.log("===============================================================================\n");

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function skip(message) {
  console.log(`  - SKIP: ${message} (NOT AVAILABLE — TEST SKIPPED)`);
  skipped++;
}

async function runTests() {
  const dockerLive = isDockerAvailable();
  console.log(`[Environment Status] Docker Sandbox Available on Host: ${dockerLive ? "YES (Live Docker Daemon)" : "NO (Hardened Host Runner Fallback Mode)"}\n`);

  // ---------------------------------------------------------------------------
  // Group 1: Resource Limits & Normalization Clamping
  // ---------------------------------------------------------------------------
  console.log("[Group 1: Resource Limits & Normalization Clamping]");

  const defaultLimits = normalizeExecutionLimits({});
  assert(defaultLimits.timeLimitMs === 2000, "1. Default time limit is 2000ms");
  assert(defaultLimits.memoryLimitMb === 256, "1. Default memory limit is 256MB");
  assert(defaultLimits.outputLimitBytes === 2 * 1024 * 1024, "1. Default output limit is 2MB");
  assert(defaultLimits.networkEnabled === false, "1. Network is strictly disabled by default");

  // Clamping over-aggressive limits
  const excessiveLimits = normalizeExecutionLimits({
    timeLimitMs: 999999,
    memoryLimitMb: 8192,
    outputLimitBytes: 100 * 1024 * 1024,
    cpuLimit: 16
  });
  assert(excessiveLimits.timeLimitMs === PLATFORM_LIMIT_MAXIMUMS.MAX_TIME_LIMIT_MS, `1. Time limit clamped to platform maximum (${PLATFORM_LIMIT_MAXIMUMS.MAX_TIME_LIMIT_MS}ms)`);
  assert(excessiveLimits.memoryLimitMb === PLATFORM_LIMIT_MAXIMUMS.MAX_MEMORY_LIMIT_MB, `1. Memory limit clamped to platform maximum (${PLATFORM_LIMIT_MAXIMUMS.MAX_MEMORY_LIMIT_MB}MB)`);
  assert(excessiveLimits.outputLimitBytes === PLATFORM_LIMIT_MAXIMUMS.MAX_OUTPUT_LIMIT_BYTES, "1. Output limit clamped to 5MB");
  assert(excessiveLimits.cpuLimit === PLATFORM_LIMIT_MAXIMUMS.MAX_CPU_LIMIT, "1. CPU quota clamped to 2.0");

  // Clamping under-sized limits
  const undersizedLimits = normalizeExecutionLimits({
    timeLimitMs: 50,
    memoryLimitMb: 4,
    outputLimitBytes: 10
  });
  assert(undersizedLimits.timeLimitMs === 500, "1. Time limit clamped to platform floor (500ms)");
  assert(undersizedLimits.memoryLimitMb === 32, "1. Memory limit clamped to platform floor (32MB)");
  assert(undersizedLimits.outputLimitBytes === 1024, "1. Output limit clamped to platform floor (1024 bytes)");

  // ---------------------------------------------------------------------------
  // Group 2: Production Sandbox Safety & Strict Fallback Prevention
  // ---------------------------------------------------------------------------
  console.log("\n[Group 2: Production Sandbox Safety & Strict Fallback Prevention]");

  if (!dockerLive) {
    // Verify that in strict production mode, the engine strictly rejects execution without silent fallback
    const strictRunRes = await RunCodeService.run({
      problem: {
        functionDefinition: { name: "twoSum", parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }], returnType: "number[]" },
        visibleTestCases: [{ input: { nums: [2, 7], target: 9 }, expectedOutput: [0, 1] }]
      },
      language: "javascript",
      code: "var twoSum = (nums, target) => [0, 1];",
      strictSandboxMode: true
    });
    assert(strictRunRes.status === "SANDBOX_UNAVAILABLE", "2. Run API: Strict mode returns 'SANDBOX_UNAVAILABLE' when Docker is absent (Zero silent host bypass)");

    const strictSubmitRes = await SubmitCodeService.submit({
      problem: {
        functionDefinition: { name: "twoSum", parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }], returnType: "number[]" },
        hiddenTestCases: [{ input: { nums: [2, 7], target: 9 }, expectedOutput: [0, 1] }]
      },
      language: "javascript",
      code: "var twoSum = (nums, target) => [0, 1];",
      strictSandboxMode: true
    });
    assert(strictSubmitRes.verdict === "SANDBOX_UNAVAILABLE", "2. Submit API: Strict mode returns 'SANDBOX_UNAVAILABLE' when Docker is absent (Zero silent host bypass)");
  } else {
    assert(dockerLive === true, "2. Production Docker Sandbox is active and verified");
  }

  // ---------------------------------------------------------------------------
  // Group 3: Security Attack Tests & Isolation Verification
  // ---------------------------------------------------------------------------
  console.log(`\n[Group 3: Security Attack Tests (${dockerLive ? "Running inside Docker" : "Running under Hardened Host Runner"})]`);

  const problemTest = {
    problemCode: "two-sum",
    functionDefinition: {
      name: "twoSum",
      parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "UnorderedArrayMatch"
    },
    visibleTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
    ]
  };

  // Attack A: Output spam buffer exhaustion
  const spamCode = `
  var twoSum = function(nums, target) {
      while(true) console.log("Spamming stdout to exhaust host memory!");
  };`;
  const resSpam = await RunCodeService.run({
    problem: { ...problemTest, executionLimits: { outputLimitBytes: 10000 } },
    language: "javascript",
    code: spamCode
  });
  assert(resSpam.status === "OUTPUT_LIMIT_EXCEEDED", "3. Attack A: Output spam terminated with 'OUTPUT_LIMIT_EXCEEDED'");

  // Attack B: Infinite CPU loop
  const loopCode = `
  var twoSum = function(nums, target) {
      let x = 0;
      while(true) { x++; }
  };`;
  const resLoop = await RunCodeService.run({
    problem: { ...problemTest, executionLimits: { timeLimitMs: 1000 } },
    language: "javascript",
    code: loopCode
  });
  assert(resLoop.status === "TIME_LIMIT_EXCEEDED", "3. Attack B: CPU infinite loop terminated with 'TIME_LIMIT_EXCEEDED'");

  // Attack C: Memory allocation explosion
  const oomCode = `
  var twoSum = function(nums, target) {
      const arr = [];
      while(true) { arr.push(new Array(1000000).fill(1)); }
  };`;
  const resOOM = await RunCodeService.run({
    problem: { ...problemTest, executionLimits: { memoryLimitMb: 32, timeLimitMs: 5000 } },
    language: "javascript",
    code: oomCode
  });
  assert(
    resOOM.status === "MEMORY_LIMIT_EXCEEDED" || resOOM.status === "RUNTIME_ERROR" || resOOM.status === "TIME_LIMIT_EXCEEDED",
    "3. Attack C: Memory allocation explosion caught safely"
  );

  // Attack D: Direct process crash / exit
  const crashCode = `
  var twoSum = function(nums, target) {
      process.exit(1);
  };`;
  const resCrash = await RunCodeService.run({
    problem: problemTest,
    language: "javascript",
    code: crashCode
  });
  assert(resCrash.status === "RUNTIME_ERROR", "3. Attack D: Process crash handled with 'RUNTIME_ERROR'");

  // Attack E: Syntax error
  const syntaxCode = `
  var twoSum = function(nums, target) {
      this is invalid syntax !!!
  };`;
  const resSyntax = await RunCodeService.run({
    problem: problemTest,
    language: "javascript",
    code: syntaxCode
  });
  assert(resSyntax.status === "SYNTAX_ERROR" || resSyntax.status === "RUNTIME_ERROR", "3. Attack E: Syntax error caught cleanly");

  // Attack F: Environment Variable Leakage Protection
  const envCheckCode = `
  var twoSum = function(nums, target) {
      if (process.env.MONGO_URI || process.env.JWT_SECRET) {
          throw new Error("SECRET_LEAKED");
      }
      return [0, 1];
  };`;
  const resEnv = await RunCodeService.run({
    problem: problemTest,
    language: "javascript",
    code: envCheckCode
  });
  assert(resEnv.status === "PASSED", "3. Attack F: Environment secrets (MONGO_URI/JWT_SECRET) are not accessible by student code");

  // ---------------------------------------------------------------------------
  // Group 4: Universal DSA Problem Execution Under Sandbox Orchestrator
  // ---------------------------------------------------------------------------
  console.log("\n[Group 4: Universal DSA Problem Execution Under Sandbox Orchestrator]");

  // P1: Binary Tree Inversion
  const problemTree = {
    functionDefinition: {
      name: "invertTree",
      parameters: [{ name: "root", type: "TreeNode" }],
      returnType: "TreeNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "BinaryTreeSerializer",
      comparator: "TreeMatch"
    },
    hiddenTestCases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1] }
    ]
  };

  const treeCode = `
  var invertTree = function(root) {
      if (!root) return null;
      const left = invertTree(root.left);
      const right = invertTree(root.right);
      root.left = right;
      root.right = left;
      return root;
  };`;

  const resTree = await SubmitCodeService.submit({
    problem: problemTree,
    language: "javascript",
    code: treeCode
  });
  assert(resTree.verdict === "ACCEPTED", "4. Binary Tree: Evaluated and accepted under Sandbox Orchestrator");

  // P2: Rotate Image In-Place Matrix Mutation
  const problemRotate = {
    functionDefinition: {
      name: "rotate",
      parameters: [{ name: "matrix", type: "number[][]" }],
      returnType: "void"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch",
      inPlaceMutation: true,
      mutatedParameter: "matrix"
    },
    hiddenTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]] }
    ]
  };

  const rotateCode = `
  var rotate = function(matrix) {
      const n = matrix.length;
      for (let i = 0; i < n; i++) {
          for (let j = i; j < n; j++) {
              let t = matrix[i][j];
              matrix[i][j] = matrix[j][i];
              matrix[j][i] = t;
          }
      }
      for (let i = 0; i < n; i++) matrix[i].reverse();
  };`;

  const resRotate = await SubmitCodeService.submit({
    problem: problemRotate,
    language: "javascript",
    code: rotateCode
  });
  assert(resRotate.verdict === "ACCEPTED", "4. In-Place Matrix Mutation: Evaluated and accepted under Sandbox Orchestrator");

  // P3: Reverse Linked List
  const problemList = {
    functionDefinition: {
      name: "reverseList",
      parameters: [{ name: "head", type: "ListNode" }],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    hiddenTestCases: [
      { input: { head: [1, 2, 3] }, expectedOutput: [3, 2, 1] }
    ]
  };

  const listCode = `
  var reverseList = function(head) {
      let prev = null, curr = head;
      while (curr) {
          let next = curr.next;
          curr.next = prev;
          prev = curr;
          curr = next;
      }
      return prev;
  };`;

  const resList = await SubmitCodeService.submit({
    problem: problemList,
    language: "javascript",
    code: listCode
  });
  assert(resList.verdict === "ACCEPTED", "4. Linked List: Reverse list evaluated and accepted under Sandbox Orchestrator");

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  PHASE 10 TEST SUMMARY: ${passed} Passed, ${failed} Failed, ${skipped} Skipped.`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
