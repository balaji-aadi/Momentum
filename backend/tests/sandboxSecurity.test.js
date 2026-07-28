import { executePythonJudge } from "../services/judge/pythonJudgeRunner.js";

console.log("=== Running Universal Execution Engine Sandbox & Security Unit Tests ===");

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
  parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
  returnType: "number[]"
};

const execProfile = {
  runtimeType: "FUNCTION",
  inputParser: "ArrayParser",
  outputSerializer: "ArraySerializer",
  comparator: "UnorderedArrayMatch"
};

const testCases = [
  { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
];

async function runSecurityTests() {
  // Test 1: Security Sanitizer blocks dangerous 'import os'
  const maliciousCode = `
import os
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        os.system("whoami")
        return [0, 1]
`;

  const secRes = await executePythonJudge({
    studentCode: maliciousCode,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases
  });

  assert(secRes.verdict === "Security Error", `Blocked malicious code with Security Error (received ${secRes.verdict})`);

  // Test 2: Time Limit Exceeded (Infinite Loop)
  const infiniteLoopCode = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        while True:
            pass
        return [0, 1]
`;

  const tleRes = await executePythonJudge({
    studentCode: infiniteLoopCode,
    functionDefinition: fnDef,
    executionProfile: execProfile,
    testCases,
    timeLimitMs: 500
  });

  assert(tleRes.verdict === "Time Limit Exceeded", `Terminated infinite loop with Time Limit Exceeded verdict (received ${tleRes.verdict})`);

  console.log(`\nSandbox & Security Test Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runSecurityTests().catch(err => {
  console.error("Sandbox Security test uncaught exception:", err);
  process.exit(1);
});
