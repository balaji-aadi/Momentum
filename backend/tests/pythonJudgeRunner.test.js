import { executePythonJudge } from "../services/judge/pythonJudgeRunner.js";

console.log("=== Running Universal Execution Engine PythonJudgeRunner Unit Tests ===");

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

const fnDef = {
  functionName: "twoSum",
  parameters: [
    { name: "nums", type: "number[]" },
    { name: "target", type: "number" }
  ],
  returnType: "number[]"
};

const execProfile = {
  runtimeType: "FUNCTION",
  inputParser: "ArrayParser",
  outputSerializer: "ArraySerializer",
  comparator: "UnorderedArrayMatch"
};

const testCases = [
  { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
  { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
];

async function runTests() {
  // Test 1: Valid Solution (Accepted)
  const validSolutionCode = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        m = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in m:
                return [m[diff], i]
            m[n] = i
        return []
`;

  const validRes = await executePythonJudge({
    studentCode: validSolutionCode,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases
  });

  assert(validRes.verdict === "Accepted", `Valid Two Sum code yields Accepted verdict (received ${validRes.verdict})`);
  assert(validRes.passedTestCases === 2, "Passes all 2 testcases");

  // Test 2: Wrong Answer Solution
  const wrongSolutionCode = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        return [0, 0]
`;

  const wrongRes = await executePythonJudge({
    studentCode: wrongSolutionCode,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases
  });

  assert(wrongRes.verdict === "Wrong Answer", `Wrong solution yields Wrong Answer verdict (received ${wrongRes.verdict})`);

  // Test 3: Runtime Error (Zero Division)
  const errorSolutionCode = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        return 1 / 0
`;

  const errorRes = await executePythonJudge({
    studentCode: errorSolutionCode,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases
  });

  assert(errorRes.verdict === "Runtime Error", `Zero division yields Runtime Error verdict (received ${errorRes.verdict})`);

  console.log(`\nPythonJudgeRunner Test Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test suite threw uncaught exception:", err);
  process.exit(1);
});
