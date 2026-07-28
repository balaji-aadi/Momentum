import { DriverGeneratorService } from "../services/judge/driverGenerator/DriverGeneratorService.js";

console.log("=== Running Universal Execution Engine DriverGeneratorService Unit Tests ===");

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

const studentCode = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        return [0, 1]
`;

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
  { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
];

const harness = DriverGeneratorService.generateDriverHarness("python", studentCode, fnDef, execProfile, testCases);

assert(harness.includes("class Solution:"), "Injects student solution code");
assert(harness.includes("res = fn(*args)"), "Dynamically invokes resolved callable fn(*args)");
assert(harness.includes("__SARTHI_JUDGE_OUTPUT_START__"), "Includes JSON report start marker");
assert(harness.includes("__SARTHI_JUDGE_OUTPUT_END__"), "Includes JSON report end marker");
assert(harness.includes("serialize_output"), "Includes output serialization helper");

console.log(`\nDriverGeneratorService Test Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
