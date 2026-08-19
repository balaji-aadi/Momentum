import { SubmitCodeService } from "../services/judge-service/submitCode.service.js";

console.log("===============================================================================");
console.log("  PHASE 9: STUDENT SUBMIT API (POST /judge/submit) AUTOMATED TEST SUITE");
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
  // Problem Definition with Multi-TestCase Hidden Suite
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
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] }
    ],
    executionLimits: { timeLimitMs: 2000 }
  };

  // ---------------------------------------------------------------------------
  // 1. Correct Submission -> ACCEPTED
  // ---------------------------------------------------------------------------
  console.log("[1. Correct Submission]");
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

  const resCorrect = await SubmitCodeService.submit({
    problem: problemTwoSum,
    language: "javascript",
    code: correctCode
  });

  assert(resCorrect.success === true, "1. Correct submission: success is true");
  assert(resCorrect.verdict === "ACCEPTED", "1. Correct submission: Final verdict is 'ACCEPTED'");
  assert(resCorrect.passedTestCases === 3 && resCorrect.totalTestCases === 3, "1. Correct submission: 3/3 hidden test cases passed");
  assert(resCorrect.failedTestCaseIndex === null, "1. Correct submission: failedTestCaseIndex is null");

  // ---------------------------------------------------------------------------
  // 2. Hidden Test Case Protection & Sanitization
  // ---------------------------------------------------------------------------
  console.log("\n[2. Hidden Test Case Protection & Sanitization]");
  assert(resCorrect.input === undefined, "2. Sanitization: No 'input' field in response");
  assert(resCorrect.expectedOutput === undefined, "2. Sanitization: No 'expectedOutput' field in response");
  assert(resCorrect.actualOutput === undefined, "2. Sanitization: No 'actualOutput' field in response");
  assert(resCorrect.testCases === undefined, "2. Sanitization: No 'testCases' array exposing hidden inputs/outputs");

  // ---------------------------------------------------------------------------
  // 3. Partial Pass Submission -> WRONG_ANSWER
  // ---------------------------------------------------------------------------
  console.log("\n[3. Partial Pass Submission]");
  const partialCode = `
  var twoSum = function(nums, target) {
      // Only solves test case 0 (nums=[2,7,11,15], target=9)
      if (nums[0] === 2) return [0, 1];
      return [99, 99];
  };`;

  const resPartial = await SubmitCodeService.submit({
    problem: problemTwoSum,
    language: "javascript",
    code: partialCode
  });

  assert(resPartial.verdict === "WRONG_ANSWER", "3. Partial pass: Final verdict is 'WRONG_ANSWER'");
  assert(resPartial.passedTestCases === 1, "3. Partial pass: Passed 1 test case before failing");
  assert(resPartial.failedTestCaseIndex === 1, "3. Partial pass: Failed at hidden testcase index 1");

  // ---------------------------------------------------------------------------
  // 4. Zero Pass Submission -> WRONG_ANSWER
  // ---------------------------------------------------------------------------
  console.log("\n[4. Zero Pass Submission]");
  const zeroPassCode = `
  var twoSum = function(nums, target) {
      return [-1, -1];
  };`;

  const resZero = await SubmitCodeService.submit({
    problem: problemTwoSum,
    language: "javascript",
    code: zeroPassCode
  });

  assert(resZero.verdict === "WRONG_ANSWER", "4. Zero pass: Final verdict is 'WRONG_ANSWER'");
  assert(resZero.passedTestCases === 0, "4. Zero pass: Passed 0 test cases");
  assert(resZero.failedTestCaseIndex === 0, "4. Zero pass: Failed at index 0");

  // ---------------------------------------------------------------------------
  // 5. Runtime Exception -> RUNTIME_ERROR
  // ---------------------------------------------------------------------------
  console.log("\n[5. Runtime Exception]");
  const runtimeErrCode = `
  var twoSum = function(nums, target) {
      throw new Error("Fatal submission crash");
  };`;

  const resRuntime = await SubmitCodeService.submit({
    problem: problemTwoSum,
    language: "javascript",
    code: runtimeErrCode
  });

  assert(resRuntime.verdict === "RUNTIME_ERROR", "5. Runtime crash: Final verdict is 'RUNTIME_ERROR'");
  assert(resRuntime.error !== null, "5. Runtime crash: Safe error message captured");

  // ---------------------------------------------------------------------------
  // 6. Infinite Loop -> TIME_LIMIT_EXCEEDED
  // ---------------------------------------------------------------------------
  console.log("\n[6. Infinite Loop & Time Limit]");
  const loopCode = `
  var twoSum = function(nums, target) {
      while(true) {}
  };`;

  const resTimeout = await SubmitCodeService.submit({
    problem: { ...problemTwoSum, executionLimits: { timeLimitMs: 1000 } },
    language: "javascript",
    code: loopCode
  });

  assert(resTimeout.verdict === "TIME_LIMIT_EXCEEDED", "6. Timeout: Final verdict is 'TIME_LIMIT_EXCEEDED'");

  // ---------------------------------------------------------------------------
  // 7. In-Place Mutation Problem (Rotate Image)
  // ---------------------------------------------------------------------------
  console.log("\n[7. In-Place Mutation Submission]");
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
    hiddenTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]] },
      { input: { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] }, expectedOutput: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]] }
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

  const resRotate = await SubmitCodeService.submit({
    problem: problemRotate,
    language: "javascript",
    code: rotateCode
  });

  assert(resRotate.verdict === "ACCEPTED", "7. In-place Mutation: Rotate Image submission produces 'ACCEPTED'");
  assert(resRotate.passedTestCases === 2 && resRotate.totalTestCases === 2, "7. In-place Mutation: All 2/2 testcases passed");

  // ---------------------------------------------------------------------------
  // 8. Complex DSA Problems: Reverse Linked List & Binary Tree
  // ---------------------------------------------------------------------------
  console.log("\n[8. Complex DSA Problems]");
  const problemList = {
    problemCode: "reverse-list",
    functionDefinition: {
      functionName: "reverseList",
      parameters: [{ name: "head", type: "ListNode" }],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    hiddenTestCases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1] }
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

  assert(resList.verdict === "ACCEPTED", "8. Linked List: Reverse list submission produces 'ACCEPTED'");

  // ---------------------------------------------------------------------------
  // 9. Input Validation
  // ---------------------------------------------------------------------------
  console.log("\n[9. Input Validation]");
  const resEmpty = await SubmitCodeService.submit({ problem: problemTwoSum, language: "javascript", code: "" });
  assert(resEmpty.verdict === "PROCESS_ERROR", "9. Validation: Rejects empty code string");

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  PHASE 9 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
