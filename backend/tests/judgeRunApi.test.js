import { executePythonJudge } from "../services/judge/pythonJudgeRunner.js";

console.log("=== Running Universal Execution Engine Run API Integration Tests ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  const reqPayload = {
    problemId: "two-sum",
    language: "python",
    code: `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        m = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in m:
                return [m[diff], i]
            m[n] = i
        return []
`,
    customTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
    ]
  };

  const fnDef = {
    functionName: "twoSum",
    parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
    returnType: "number[]"
  };

  const execProfile = {
    runtimeType: "FUNCTION",
    inputParser: "ArrayParser",
    outputSerializer: "ArraySerializer",
    comparator: "UnorderedArrayMatch"
  };

  const result = await executePythonJudge({
    studentCode: reqPayload.code,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases: reqPayload.customTestCases
  });

  assert(result.verdict === "Accepted", `Run API executes code and returns Accepted verdict (received ${result.verdict})`);
  assert(result.passedTestCases === 1, "Passes 1/1 testcases");

  console.log(`\nRun API Integration Test Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Run API integration test error:", err);
  process.exit(1);
});
