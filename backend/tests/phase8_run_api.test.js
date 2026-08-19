import { RunCodeService } from "../services/judge-service/runCode.service.js";

console.log("===============================================================================");
console.log("  PHASE 8: STUDENT RUN API (POST /judge/run) AUTOMATED TEST SUITE");
console.log("===============================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // ---------------------------------------------------------------------------
  // Problem Definition with Visible & Hidden Test Cases
  // ---------------------------------------------------------------------------
  const problemTwoSum = {
    problemCode: "two-sum",
    title: "Two Sum",
    functionDefinition: {
      functionName: "twoSum",
      parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "UnorderedArrayMatch"
    },
    visibleTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
    ],
    hiddenTestCases: [
      { input: { nums: [100, 200, 300], target: 500 }, expectedOutput: [1, 2], isHidden: true },
      { input: { nums: [1, 5, 9], target: 10 }, expectedOutput: [0, 2], isHidden: true }
    ],
    executionLimits: { timeLimitMs: 2000 }
  };

  // ---------------------------------------------------------------------------
  // 1. Correct Solution -> PASSED
  // ---------------------------------------------------------------------------
  console.log("[1. Correct Solution]");
  const correctCode = `
  var twoSum = function(nums, target) {
      const map = {};
      for (let i = 0; i < nums.length; i++) {
          const diff = target - nums[i];
          if (map[diff] !== undefined) return [map[diff], i];
          map[nums[i]] = i;
      }
      return [];
  };`;

  const resCorrect = await RunCodeService.run({
    problem: problemTwoSum,
    language: "javascript",
    code: correctCode
  });

  assert(resCorrect.success === true, "1. Correct solution: API call returns success: true");
  assert(resCorrect.status === "PASSED", "1. Correct solution: Overall status is 'PASSED'");
  assert(resCorrect.totalTestCases === 2 && resCorrect.passedTestCases === 2, "1. Correct solution: All 2 visible test cases passed");
  assert(resCorrect.testCases[0].status === "PASSED" && resCorrect.testCases[1].status === "PASSED", "1. Correct solution: Individual test cases marked 'PASSED'");

  // ---------------------------------------------------------------------------
  // 2. Hidden Test Case Protection (NEVER expose hidden test cases in RUN)
  // ---------------------------------------------------------------------------
  console.log("\n[2. Hidden Test Case Protection]");
  assert(resCorrect.testCases.length === 2, "2. Hidden Protection: Returned testCases array length strictly equals visibleTestCases count (2)");
  const hasHiddenInput = resCorrect.testCases.some(tc => tc.input?.nums?.[0] === 100);
  assert(!hasHiddenInput, "2. Hidden Protection: Hidden testcase inputs are strictly NOT executed or exposed");

  // ---------------------------------------------------------------------------
  // 3. Incorrect Solution -> WRONG_ANSWER
  // ---------------------------------------------------------------------------
  console.log("\n[3. Incorrect Solution]");
  const incorrectCode = `
  var twoSum = function(nums, target) {
      return [99, 99];
  };`;

  const resIncorrect = await RunCodeService.run({
    problem: problemTwoSum,
    language: "javascript",
    code: incorrectCode
  });

  assert(resIncorrect.status === "WRONG_ANSWER", "3. Incorrect solution: Overall status is 'WRONG_ANSWER'");
  assert(resIncorrect.passedTestCases === 0, "3. Incorrect solution: passedTestCases is 0");
  assert(resIncorrect.testCases[0].status === "WRONG_ANSWER", "3. Incorrect solution: Testcase 0 status is 'WRONG_ANSWER'");
  assert(JSON.stringify(resIncorrect.testCases[0].actualOutput) === "[99,99]", "3. Incorrect solution: Captures actual output [99,99]");

  // ---------------------------------------------------------------------------
  // 4. Runtime Exception -> RUNTIME_ERROR
  // ---------------------------------------------------------------------------
  console.log("\n[4. Runtime Exception]");
  const runtimeErrCode = `
  var twoSum = function(nums, target) {
      throw new Error("Student runtime crash");
  };`;

  const resRuntimeErr = await RunCodeService.run({
    problem: problemTwoSum,
    language: "javascript",
    code: runtimeErrCode
  });

  assert(resRuntimeErr.status === "RUNTIME_ERROR", "4. Runtime Error: Overall status is 'RUNTIME_ERROR'");
  assert(resRuntimeErr.error.includes("Student runtime crash"), "4. Runtime Error: Error message captured accurately");

  // ---------------------------------------------------------------------------
  // 5. Infinite Loop -> TIME_LIMIT_EXCEEDED
  // ---------------------------------------------------------------------------
  console.log("\n[5. Infinite Loop & Timeouts]");
  const timeoutCode = `
  var twoSum = function(nums, target) {
      while(true) {}
  };`;

  const resTimeout = await RunCodeService.run({
    problem: { ...problemTwoSum, executionLimits: { timeLimitMs: 1000 } },
    language: "javascript",
    code: timeoutCode
  });

  assert(resTimeout.status === "TIME_LIMIT_EXCEEDED", "5. Timeout: Overall status is 'TIME_LIMIT_EXCEEDED'");

  // ---------------------------------------------------------------------------
  // 6. In-Place Mutation Problem (Rotate Image)
  // ---------------------------------------------------------------------------
  console.log("\n[6. In-Place Mutation Problem]");
  const problemRotate = {
    problemCode: "rotate-image",
    functionDefinition: {
      functionName: "rotate",
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
    visibleTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]] }
    ]
  };

  const rotateCode = `
  var rotate = function(matrix) {
      const n = matrix.length;
      for (let i = 0; i < n; i++) {
          for (let j = i; j < n; j++) {
              let temp = matrix[i][j];
              matrix[i][j] = matrix[j][i];
              matrix[j][i] = temp;
          }
      }
      for (let i = 0; i < n; i++) {
          matrix[i].reverse();
      }
  };`;

  const resRotate = await RunCodeService.run({
    problem: problemRotate,
    language: "javascript",
    code: rotateCode
  });

  assert(resRotate.status === "PASSED", "6. In-place Mutation: Rotate Image executes in-place and passes comparison");
  assert(JSON.stringify(resRotate.testCases[0].actualOutput) === "[[3,1],[4,2]]", "6. In-place Mutation: Mutated matrix captured as [[3,1],[4,2]]");

  // ---------------------------------------------------------------------------
  // 7. Input Validation & Edge Cases
  // ---------------------------------------------------------------------------
  console.log("\n[7. Input Validation & Edge Cases]");
  const resEmptyCode = await RunCodeService.run({ problem: problemTwoSum, language: "javascript", code: "" });
  assert(resEmptyCode.status === "PROCESS_ERROR", "7. Validation: Rejects empty code string");

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  PHASE 8 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
