import { validateSingleInput, validateProblemTestCases } from "../services/problem-service/problem.validator.js";

// Unit Tests for Universal Execution Engine Pre-flight Parameter Validator
console.log("=== Running Universal Execution Engine Parameter Validator Unit Tests ===");

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

function assertThrows(fn, expectedSubstr, message) {
  try {
    fn();
    console.error(`✗ FAIL: ${message} (Expected error containing "${expectedSubstr}", but no error was thrown)`);
    failed++;
  } catch (err) {
    if (err.message.includes(expectedSubstr)) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message} (Expected "${expectedSubstr}", received "${err.message}")`);
      failed++;
    }
  }
}

// 1. Primitive Number Validation
assertThrows(
  () => validateSingleInput("abc", "number", "target"),
  "must be a valid number",
  "Rejects string input for number parameter"
);

// 2. Number Array Validation
assertThrows(
  () => validateSingleInput("not_an_array", "number[]", "nums"),
  "must be an array of numbers",
  "Rejects non-array input for number[] parameter"
);

assertThrows(
  () => validateSingleInput([1, 2, "three"], "number[]", "nums"),
  "Element at index 2 of parameter 'nums' must be a number",
  "Rejects mixed array containing string for number[] parameter"
);

// 3. Valid Input Assertion
try {
  validateSingleInput([2, 7, 11, 15], "number[]", "nums");
  validateSingleInput(9, "number", "target");
  assert(true, "Valid number[] and number inputs pass validation");
} catch (e) {
  assert(false, `Valid inputs threw error: ${e.message}`);
}

// 4. Testcase Suite Validation
const fnDef = {
  functionName: "twoSum",
  parameters: [
    { name: "nums", type: "number[]", required: true, nullable: false },
    { name: "target", type: "number", required: true, nullable: false }
  ],
  returnType: "number[]"
};

const validVisibleTC = [
  { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
];

try {
  validateProblemTestCases(fnDef, validVisibleTC, []);
  assert(true, "Structured testcase suite passes validation");
} catch (e) {
  assert(false, `Structured testcase suite threw error: ${e.message}`);
}

const invalidVisibleTC = [
  { input: { nums: [2, 7, "invalid"], target: 9 }, expectedOutput: [0, 1] }
];

assertThrows(
  () => validateProblemTestCases(fnDef, invalidVisibleTC, []),
  "Element at index 2 of parameter 'nums' must be a number",
  "Rejects testcase suite containing invalid parameter item"
);

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
