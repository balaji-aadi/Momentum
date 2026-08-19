import { RuntimeProcessExecutor, isCommandAvailable } from "../services/judge/runners/RuntimeProcessExecutor.js";
import { DriverGeneratorService } from "../services/judge/driverGenerator/DriverGeneratorService.js";
import { InputParserRegistry } from "../services/judge/inputParsers/InputParserRegistry.js";

console.log("===============================================================================");
console.log("  PHASE 7: MULTI-LANGUAGE RUNTIME PROCESS EXECUTOR AUTOMATED TEST SUITE");
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
  // ---------------------------------------------------------------------------
  // 10 Representative DSA Problem Definitions
  // ---------------------------------------------------------------------------
  const P1_TwoSum = {
    name: "twoSum",
    parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
    returnType: "number[]"
  };

  const P2_ReverseList = {
    name: "reverseList",
    parameters: [{ name: "head", type: "ListNode" }],
    returnType: "ListNode"
  };

  const P3_AddTwoNumbers = {
    name: "addTwoNumbers",
    parameters: [{ name: "l1", type: "ListNode" }, { name: "l2", type: "ListNode" }],
    returnType: "ListNode"
  };

  const P4_InvertTree = {
    name: "invertTree",
    parameters: [{ name: "root", type: "TreeNode" }],
    returnType: "TreeNode"
  };

  const P5_NumIslands = {
    name: "numIslands",
    parameters: [{ name: "grid", type: "number[][]" }],
    returnType: "number"
  };

  const P6_RotateImage = {
    name: "rotate",
    parameters: [{ name: "matrix", type: "number[][]" }],
    returnType: "void"
  };
  const P6_RotateProfile = { inPlaceMutation: true, mutatedParameter: "matrix" };

  const P7_CopyRandomList = {
    name: "copyRandomList",
    parameters: [{ name: "head", type: "RandomListNode" }],
    returnType: "RandomListNode"
  };

  const P8_CloneGraph = {
    name: "cloneGraph",
    parameters: [{ name: "node", type: "GraphNode" }],
    returnType: "GraphNode"
  };

  const P9_MultiParam = {
    name: "findSubstring",
    parameters: [{ name: "s", type: "string" }, { name: "words", type: "string[]" }, { name: "k", type: "number" }],
    returnType: "number[]"
  };

  const P10_SortColors = {
    name: "sortColors",
    parameters: [{ name: "nums", type: "number[]" }],
    returnType: "void"
  };
  const P10_SortColorsProfile = { inPlaceMutation: true, mutatedParameter: "nums" };

  // ---------------------------------------------------------------------------
  // Group 1: Real JavaScript End-to-End Execution (10 DSA Problems)
  // ---------------------------------------------------------------------------
  console.log("[Group 1: Real JavaScript End-to-End Execution Across 10 DSA Problems]");

  // P1: Two Sum
  const jsCodeP1 = `
  var twoSum = function(nums, target) {
      const map = {};
      for (let i = 0; i < nums.length; i++) {
          const diff = target - nums[i];
          if (map[diff] !== undefined) return [map[diff], i];
          map[nums[i]] = i;
      }
      return [];
  };`;
  const tcP1 = [{ input: { nums: [2, 7, 11, 15], target: 9 } }];
  const srcP1 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP1, P1_TwoSum, {}, tcP1);
  const resP1 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP1 });
  assert(resP1.status === "SUCCESS" && JSON.stringify(resP1.envelope?.results?.[0]?.output) === "[0,1]", "1. P1 Two Sum: Live execution returns [0,1]");

  // P2: Reverse Linked List
  const jsCodeP2 = `
  var reverseList = function(head) {
      let prev = null;
      let curr = head;
      while (curr) {
          let next = curr.next;
          curr.next = prev;
          prev = curr;
          curr = next;
      }
      return prev;
  };`;
  const tcP2 = [{ input: { head: [1, 2, 3] } }];
  const srcP2 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP2, P2_ReverseList, {}, tcP2);
  const resP2 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP2 });
  assert(resP2.status === "SUCCESS" && JSON.stringify(resP2.envelope?.results?.[0]?.output) === "[3,2,1]", "1. P2 Reverse List: Live execution returns [3,2,1]");

  // P3: Add Two Numbers
  const jsCodeP3 = `
  var addTwoNumbers = function(l1, l2) {
      const dummy = new ListNode(0);
      let curr = dummy;
      let carry = 0;
      while (l1 || l2 || carry) {
          const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
          carry = Math.floor(sum / 10);
          curr.next = new ListNode(sum % 10);
          curr = curr.next;
          if (l1) l1 = l1.next;
          if (l2) l2 = l2.next;
      }
      return dummy.next;
  };`;
  const tcP3 = [{ input: { l1: [2, 4, 3], l2: [5, 6, 4] } }];
  const srcP3 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP3, P3_AddTwoNumbers, {}, tcP3);
  const resP3 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP3 });
  assert(resP3.status === "SUCCESS" && JSON.stringify(resP3.envelope?.results?.[0]?.output) === "[7,0,8]", "1. P3 Add Two Numbers: Live execution returns [7,0,8]");

  // P4: Invert Binary Tree
  const jsCodeP4 = `
  var invertTree = function(root) {
      if (!root) return null;
      const temp = root.left;
      root.left = invertTree(root.right);
      root.right = invertTree(temp);
      return root;
  };`;
  const tcP4 = [{ input: { root: [4, 2, 7, 1, 3, 6, 9] } }];
  const srcP4 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP4, P4_InvertTree, {}, tcP4);
  const resP4 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP4 });
  assert(resP4.status === "SUCCESS" && JSON.stringify(resP4.envelope?.results?.[0]?.output) === "[4,7,2,9,6,3,1]", "1. P4 Invert Tree: Live execution returns [4,7,2,9,6,3,1]");

  // P5: Number of Islands
  const jsCodeP5 = `
  var numIslands = function(grid) {
      return 1;
  };`;
  const tcP5 = [{ input: { grid: [[1, 1], [1, 0]] } }];
  const srcP5 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP5, P5_NumIslands, {}, tcP5);
  const resP5 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP5 });
  assert(resP5.status === "SUCCESS" && resP5.envelope?.results?.[0]?.output === 1, "1. P5 Num Islands: Live execution returns 1");

  // P6: Rotate Image (In-Place Mutation)
  const jsCodeP6 = `
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
  const tcP6 = [{ input: { matrix: [[1, 2], [3, 4]] } }];
  const srcP6 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP6, P6_RotateImage, P6_RotateProfile, tcP6);
  const resP6 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP6 });
  assert(resP6.status === "SUCCESS" && JSON.stringify(resP6.envelope?.results?.[0]?.output) === "[[3,1],[4,2]]", "1. P6 Rotate Image: Captures in-place mutated matrix [[3,1],[4,2]]");

  // P7: Copy Random List
  const jsCodeP7 = `
  var copyRandomList = function(head) {
      if (!head) return null;
      const clone = new Node(head.val);
      return clone;
  };`;
  const tcP7 = [{ input: { head: [[7, null]] } }];
  const srcP7 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP7, P7_CopyRandomList, {}, tcP7);
  const resP7 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP7 });
  assert(resP7.status === "SUCCESS" && JSON.stringify(resP7.envelope?.results?.[0]?.output) === "[[7,null]]", "1. P7 Copy Random List: Live execution returns [[7,null]]");

  // P8: Clone Graph
  const jsCodeP8 = `
  var cloneGraph = function(node) {
      if (!node) return null;
      const copy = new Node(node.val);
      return copy;
  };`;
  const tcP8 = [{ input: { node: [[2], [1]] } }];
  const srcP8 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP8, P8_CloneGraph, {}, tcP8);
  const resP8 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP8 });
  assert(resP8.status === "SUCCESS" && resP8.envelope?.results?.[0]?.output !== undefined, "1. P8 Clone Graph: Live execution returns cloned graph");

  // P9: Multi-Parameter Function
  const jsCodeP9 = `
  var findSubstring = function(s, words, k) {
      return [0, k];
  };`;
  const tcP9 = [{ input: { s: "barfoothefoobarman", words: ["foo", "bar"], k: 9 } }];
  const srcP9 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP9, P9_MultiParam, {}, tcP9);
  const resP9 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP9 });
  assert(resP9.status === "SUCCESS" && JSON.stringify(resP9.envelope?.results?.[0]?.output) === "[0,9]", "1. P9 Multi-Param: Live execution returns [0,9]");

  // P10: Sort Colors (In-Place Array)
  const jsCodeP10 = `
  var sortColors = function(nums) {
      nums.sort((a, b) => a - b);
  };`;
  const tcP10 = [{ input: { nums: [2, 0, 2, 1, 1, 0] } }];
  const srcP10 = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP10, P10_SortColors, P10_SortColorsProfile, tcP10);
  const resP10 = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcP10 });
  assert(resP10.status === "SUCCESS" && JSON.stringify(resP10.envelope?.results?.[0]?.output) === "[0,0,1,1,2,2]", "1. P10 Sort Colors: Captures in-place mutated array [0,0,1,1,2,2]");

  // ---------------------------------------------------------------------------
  // Group 2: Execution Outcomes & Failure Modes
  // ---------------------------------------------------------------------------
  console.log("\n[Group 2: Execution Outcomes & Failure Modes]");

  // Scenario A: Incorrect Solution (Must return status: "SUCCESS", NOT "WRONG_ANSWER")
  const jsIncorrect = `
  var twoSum = function(nums, target) {
      return [99, 99];
  };`;
  const srcInc = DriverGeneratorService.generateDriverHarness("javascript", jsIncorrect, P1_TwoSum, {}, tcP1);
  const resInc = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcInc });
  assert(resInc.status === "SUCCESS" && JSON.stringify(resInc.envelope?.results?.[0]?.output) === "[99,99]", "2. Incorrect Solution returns SUCCESS with output preserved (Zero premature WRONG_ANSWER)");

  // Scenario B: Runtime Exception
  const jsRuntimeErr = `
  var twoSum = function(nums, target) {
      throw new Error("Custom user runtime exception");
  };`;
  const srcErr = DriverGeneratorService.generateDriverHarness("javascript", jsRuntimeErr, P1_TwoSum, {}, tcP1);
  const resErr = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcErr });
  assert(resErr.status === "RUNTIME_ERROR" && resErr.envelope?.errorType !== undefined, "2. Runtime Exception returns status: 'RUNTIME_ERROR' with error details");

  // Scenario C: Infinite Loop / Timeout Enforcement
  const jsTimeout = `
  var twoSum = function(nums, target) {
      while(true) {}
  };`;
  const srcTimeout = DriverGeneratorService.generateDriverHarness("javascript", jsTimeout, P1_TwoSum, {}, tcP1);
  const resTimeout = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcTimeout, timeLimitMs: 1000 });
  assert(resTimeout.status === "TIME_LIMIT_EXCEEDED", "2. Infinite loop terminated cleanly with status: 'TIME_LIMIT_EXCEEDED'");

  // Scenario D: Output Limit Exceeded
  const jsOutputLimit = `
  var twoSum = function(nums, target) {
      while(true) {
          console.log("Spam output line that will overflow buffer");
      }
  };`;
  const srcOutputLimit = DriverGeneratorService.generateDriverHarness("javascript", jsOutputLimit, P1_TwoSum, {}, tcP1);
  const resOutputLimit = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcOutputLimit, maxOutputBytes: 10000 });
  assert(resOutputLimit.status === "OUTPUT_LIMIT_EXCEEDED", "2. Excessive output loop terminated with status: 'OUTPUT_LIMIT_EXCEEDED'");

  // Scenario E: Syntax Error
  const jsSyntax = `
  var twoSum = function(nums, target) {
      this is invalid syntax !!!
  };`;
  const srcSyntax = DriverGeneratorService.generateDriverHarness("javascript", jsSyntax, P1_TwoSum, {}, tcP1);
  const resSyntax = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcSyntax });
  assert(resSyntax.status === "SYNTAX_ERROR" || resSyntax.status === "RUNTIME_ERROR", "2. Syntax error caught and reported cleanly");

  // Scenario F: Multi-TestCase Batch Execution
  const multiTCs = [
    { input: { nums: [2, 7, 11, 15], target: 9 } },
    { input: { nums: [3, 2, 4], target: 6 } },
    { input: { nums: [3, 3], target: 6 } }
  ];
  const srcBatch = DriverGeneratorService.generateDriverHarness("javascript", jsCodeP1, P1_TwoSum, {}, multiTCs);
  const resBatch = await RuntimeProcessExecutor.executeProgram({ language: "javascript", sourceCode: srcBatch });
  assert(
    resBatch.status === "SUCCESS" &&
    resBatch.envelope?.results?.length === 3 &&
    resBatch.envelope.results[0].testCaseIndex === 0 &&
    resBatch.envelope.results[1].testCaseIndex === 1 &&
    resBatch.envelope.results[2].testCaseIndex === 2,
    "2. Multi-TestCase Batch: Correctly executes 3 test cases in batch with indexed results"
  );

  // ---------------------------------------------------------------------------
  // Group 3: Environment Checks for Python, C++, Java
  // ---------------------------------------------------------------------------
  console.log("\n[Group 3: Other Language Runtimes Availability]");

  // Python Check
  if (isCommandAvailable("python3") || isCommandAvailable("python")) {
    const pyCode = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]";
    const srcPy = DriverGeneratorService.generateDriverHarness("python", pyCode, P1_TwoSum, {}, tcP1);
    const resPy = await RuntimeProcessExecutor.executeProgram({ language: "python", sourceCode: srcPy });
    assert(resPy.status === "SUCCESS", "3. Python: Live execution passes");
  } else {
    skip("Python interpreter");
  }

  // C++ Check
  if (isCommandAvailable("g++")) {
    const cppCode = "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {0, 1}; } };";
    const srcCpp = DriverGeneratorService.generateDriverHarness("cpp", cppCode, P1_TwoSum, {}, tcP1);
    const resCpp = await RuntimeProcessExecutor.executeProgram({ language: "cpp", sourceCode: srcCpp });
    assert(resCpp.status === "SUCCESS", "3. C++: Live compilation & execution passes");
  } else {
    skip("g++ compiler");
  }

  // Java Check
  if (isCommandAvailable("javac") && isCommandAvailable("java")) {
    const javaCode = "class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; } }";
    const srcJava = DriverGeneratorService.generateDriverHarness("java", javaCode, P1_TwoSum, {}, tcP1);
    const resJava = await RuntimeProcessExecutor.executeProgram({ language: "java", sourceCode: srcJava });
    assert(resJava.status === "SUCCESS", "3. Java: Live compilation & JVM execution passes");
  } else {
    skip("javac/java JDK");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  PHASE 7 TEST SUMMARY: ${passed} Passed, ${failed} Failed, ${skipped} Skipped.`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
