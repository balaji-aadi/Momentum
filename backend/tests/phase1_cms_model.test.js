import { 
  DATA_TYPE_PARSER_MAP, 
  RETURN_TYPE_SERIALIZER_MAP, 
  SERIALIZER_COMPARATOR_MAP, 
  validateExecutionProfileCompatibility, 
  validateSingleInput, 
  validateSingleOutput, 
  validateProblemTestCases 
} from "../services/problem-service/problem.validator.js";

console.log("===============================================================================");
console.log("  PHASE 1: PROBLEM MODEL & CMS ARCHITECTURE AUTOMATED TEST SUITE");
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

function assertThrows(fn, expectedSubstr, message) {
  try {
    fn();
    console.error(`  ✗ FAIL: ${message} (Expected error containing "${expectedSubstr}", but no error was thrown)`);
    failed++;
  } catch (err) {
    if (err.message.toLowerCase().includes(expectedSubstr.toLowerCase())) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message} (Expected "${expectedSubstr}", received "${err.message}")`);
      failed++;
    }
  }
}

// -----------------------------------------------------------------------------
// GROUP 1: Parameter Type to Parser Contract Mapping
// -----------------------------------------------------------------------------
console.log("\n[Group 1: Parameter Type -> Parser Contract Mapping]");

assert(DATA_TYPE_PARSER_MAP['number'] === 'PrimitiveParser', "Maps 'number' -> PrimitiveParser");
assert(DATA_TYPE_PARSER_MAP['string'] === 'PrimitiveParser', "Maps 'string' -> PrimitiveParser");
assert(DATA_TYPE_PARSER_MAP['boolean'] === 'PrimitiveParser', "Maps 'boolean' -> PrimitiveParser");
assert(DATA_TYPE_PARSER_MAP['number[]'] === 'ArrayParser', "Maps 'number[]' -> ArrayParser");
assert(DATA_TYPE_PARSER_MAP['string[]'] === 'ArrayParser', "Maps 'string[]' -> ArrayParser");
assert(DATA_TYPE_PARSER_MAP['number[][]'] === 'MatrixParser', "Maps 'number[][]' -> MatrixParser");
assert(DATA_TYPE_PARSER_MAP['listnode'] === 'LinkedListParser', "Maps 'ListNode' -> LinkedListParser");
assert(DATA_TYPE_PARSER_MAP['randomlistnode'] === 'RandomListParser', "Maps 'RandomListNode' -> RandomListParser");
assert(DATA_TYPE_PARSER_MAP['treenode'] === 'BinaryTreeParser', "Maps 'TreeNode' -> BinaryTreeParser");
assert(DATA_TYPE_PARSER_MAP['graph'] === 'GraphParser', "Maps 'Graph' -> GraphParser");

// -----------------------------------------------------------------------------
// GROUP 2: Cross-Field Execution Profile Compatibility Rejection
// -----------------------------------------------------------------------------
console.log("\n[Group 2: Cross-Field Execution Profile Compatibility (Rejection Tests)]");

// 2.1 Rejects non-FUNCTION runtime
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "test", parameters: [], returnType: "number" },
    { runtimeType: "CONSOLE_INPUT", outputSerializer: "PrimitiveSerializer", comparator: "ExactMatch" }
  ),
  "Only 'FUNCTION' runtimeType is supported",
  "Rejects CONSOLE_INPUT runtimeType in Phase 1"
);

// 2.2 Rejects ListNode return type with ArraySerializer
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "reverseList", parameters: [{ name: "head", type: "ListNode" }], returnType: "ListNode" },
    { runtimeType: "FUNCTION", outputSerializer: "ArraySerializer", comparator: "ExactMatch" }
  ),
  "is incompatible with return type 'ListNode'",
  "Rejects returnType: ListNode with ArraySerializer"
);

// 2.3 Rejects TreeNode return type with LinkedListSerializer
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "invertTree", parameters: [{ name: "root", type: "TreeNode" }], returnType: "TreeNode" },
    { runtimeType: "FUNCTION", outputSerializer: "LinkedListSerializer", comparator: "LinkedListMatch" }
  ),
  "is incompatible with return type 'TreeNode'",
  "Rejects returnType: TreeNode with LinkedListSerializer"
);

// 2.4 Rejects FloatToleranceMatch on non-float return type
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "twoSum", parameters: [{ name: "nums", type: "number[]" }], returnType: "number[]" },
    { runtimeType: "FUNCTION", outputSerializer: "ArraySerializer", comparator: "FloatToleranceMatch" }
  ),
  "FloatToleranceMatch",
  "Rejects FloatToleranceMatch on number[] return type"
);

// 2.5 Rejects TreeMatch on Primitive string return type
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "longestCommonPrefix", parameters: [{ name: "strs", type: "string[]" }], returnType: "string" },
    { runtimeType: "FUNCTION", outputSerializer: "PrimitiveSerializer", comparator: "TreeMatch" }
  ),
  "is incompatible with output serializer 'PrimitiveSerializer'",
  "Rejects TreeMatch on PrimitiveSerializer"
);

// 2.6 Rejects unregistered parameter data type
assertThrows(
  () => validateExecutionProfileCompatibility(
    { functionName: "customFn", parameters: [{ name: "weirdParam", type: "UnregisteredCustomClass" }], returnType: "number" },
    { runtimeType: "FUNCTION", outputSerializer: "PrimitiveSerializer", comparator: "ExactMatch" }
  ),
  "unsupported or unregistered type",
  "Rejects unregistered parameter type"
);

// -----------------------------------------------------------------------------
// GROUP 3: Cross-Field Execution Profile Compatibility Acceptance
// -----------------------------------------------------------------------------
console.log("\n[Group 3: Cross-Field Execution Profile Compatibility (Acceptance Tests)]");

try {
  // 3.1 Two Sum (Array + Primitive inputs, Array return type)
  validateExecutionProfileCompatibility(
    {
      functionName: "twoSum",
      parameters: [
        { name: "nums", type: "number[]" },
        { name: "target", type: "number" }
      ],
      returnType: "number[]"
    },
    { runtimeType: "FUNCTION", outputSerializer: "ArraySerializer", comparator: "UnorderedArrayMatch" }
  );
  assert(true, "Accepts TwoSum configuration (ArrayParser + PrimitiveParser -> ArraySerializer -> UnorderedArrayMatch)");
} catch (e) {
  assert(false, `TwoSum configuration failed: ${e.message}`);
}

try {
  // 3.2 Reverse Linked List (ListNode input -> ListNode return type)
  validateExecutionProfileCompatibility(
    {
      functionName: "reverseList",
      parameters: [{ name: "head", type: "ListNode" }],
      returnType: "ListNode"
    },
    { runtimeType: "FUNCTION", outputSerializer: "LinkedListSerializer", comparator: "LinkedListMatch" }
  );
  assert(true, "Accepts ReverseList configuration (LinkedListParser -> LinkedListSerializer -> LinkedListMatch)");
} catch (e) {
  assert(false, `ReverseList configuration failed: ${e.message}`);
}

try {
  // 3.3 Invert Binary Tree (TreeNode input -> TreeNode return type)
  validateExecutionProfileCompatibility(
    {
      functionName: "invertTree",
      parameters: [{ name: "root", type: "TreeNode" }],
      returnType: "TreeNode"
    },
    { runtimeType: "FUNCTION", outputSerializer: "BinaryTreeSerializer", comparator: "TreeMatch" }
  );
  assert(true, "Accepts InvertTree configuration (BinaryTreeParser -> BinaryTreeSerializer -> TreeMatch)");
} catch (e) {
  assert(false, `InvertTree configuration failed: ${e.message}`);
}

try {
  // 3.4 Number of Islands (2D Matrix input -> number return type)
  validateExecutionProfileCompatibility(
    {
      functionName: "numIslands",
      parameters: [{ name: "grid", type: "number[][]" }],
      returnType: "number"
    },
    { runtimeType: "FUNCTION", outputSerializer: "PrimitiveSerializer", comparator: "ExactMatch" }
  );
  assert(true, "Accepts NumIslands configuration (MatrixParser -> PrimitiveSerializer -> ExactMatch)");
} catch (e) {
  assert(false, `NumIslands configuration failed: ${e.message}`);
}

// -----------------------------------------------------------------------------
// GROUP 4: Parameter-Based Single Input Validation
// -----------------------------------------------------------------------------
console.log("\n[Group 4: Parameter-Based Single Input Validation]");

// 4.1 Primitives
try {
  validateSingleInput(42, "number", "count");
  validateSingleInput("hello world", "string", "text");
  validateSingleInput(true, "boolean", "flag");
  assert(true, "Validates primitives (number, string, boolean)");
} catch (e) {
  assert(false, `Primitive validation threw error: ${e.message}`);
}

assertThrows(() => validateSingleInput("not_a_number", "number", "target"), "must be a valid number", "Rejects string for number");
assertThrows(() => validateSingleInput(123, "string", "name"), "must be a string", "Rejects number for string");
assertThrows(() => validateSingleInput("true", "boolean", "flag"), "must be a boolean", "Rejects string for boolean");

// 4.2 1D Arrays
try {
  validateSingleInput([1, 2, 3, 4], "number[]", "nums");
  validateSingleInput(["a", "b", "c"], "string[]", "words");
  validateSingleInput([true, false], "boolean[]", "bits");
  assert(true, "Validates 1D arrays (number[], string[], boolean[])");
} catch (e) {
  assert(false, `1D array validation threw error: ${e.message}`);
}

assertThrows(() => validateSingleInput([1, "two", 3], "number[]", "nums"), "must be a number", "Rejects non-number item in number[]");
assertThrows(() => validateSingleInput("not_array", "number[]", "nums"), "must be an array", "Rejects string for number[]");

// 4.3 2D Matrices
try {
  validateSingleInput([[1, 2], [3, 4]], "number[][]", "matrix");
  validateSingleInput([["x", "o"], ["o", "x"]], "string[][]", "board");
  assert(true, "Validates 2D matrices (number[][], string[][])");
} catch (e) {
  assert(false, `2D Matrix validation threw error: ${e.message}`);
}

assertThrows(() => validateSingleInput([1, 2, 3], "number[][]", "matrix"), "Row 0 of parameter 'matrix' must be an array", "Rejects 1D array for 2D matrix");
assertThrows(() => validateSingleInput([[1, "two"], [3, 4]], "number[][]", "matrix"), "must be a number", "Rejects mixed item in 2D matrix");

// 4.4 Complex DSA Structures (ListNode, RandomListNode, TreeNode, Graph)
try {
  validateSingleInput([1, 2, 3, 4, 5], "ListNode", "head");
  validateSingleInput(null, "ListNode", "head");
  validateSingleInput([[7, null], [13, 0], [11, 4]], "RandomListNode", "head");
  validateSingleInput([1, null, 2, 3], "TreeNode", "root");
  validateSingleInput([[2, 4], [1, 3], [2, 4], [1, 3]], "Graph", "adjList");
  assert(true, "Validates complex DSA inputs (ListNode, RandomListNode, TreeNode, Graph)");
} catch (e) {
  assert(false, `Complex DSA validation threw error: ${e.message}`);
}

// -----------------------------------------------------------------------------
// GROUP 5: Structured Test Case Suite Validation
// -----------------------------------------------------------------------------
console.log("\n[Group 5: Structured Test Case Suite Validation]");

const sampleFnDef = {
  functionName: "twoSum",
  parameters: [
    { name: "nums", type: "number[]", required: true, nullable: false },
    { name: "target", type: "number", required: true, nullable: false },
    { name: "note", type: "string", required: false, nullable: true }
  ],
  returnType: "number[]"
};

// 5.1 Valid suite passes
try {
  const visibleTC = [
    { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
  ];
  const hiddenTC = [
    { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] }
  ];
  validateProblemTestCases(sampleFnDef, visibleTC, hiddenTC);
  assert(true, "Valid multi-parameter testcase suite passes validation");
} catch (e) {
  assert(false, `Valid testcase suite failed: ${e.message}`);
}

// 5.2 Missing required parameter
assertThrows(
  () => {
    const invalidTC = [{ input: { nums: [2, 7, 11, 15] }, expectedOutput: [0, 1] }]; // missing target
    validateProblemTestCases(sampleFnDef, invalidTC, []);
  },
  "missing required parameter 'target'",
  "Rejects testcase missing required parameter 'target'"
);

// 5.3 Type error inside testcase parameter
assertThrows(
  () => {
    const invalidTC = [{ input: { nums: [2, "seven", 11], target: 9 }, expectedOutput: [0, 1] }];
    validateProblemTestCases(sampleFnDef, invalidTC, []);
  },
  "Element at index 1 of parameter 'nums' must be a number",
  "Rejects testcase with invalid type in parameter value"
);

// 5.4 Expected output type mismatch
assertThrows(
  () => {
    const invalidTC = [{ input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: "invalid_output_string" }];
    validateProblemTestCases(sampleFnDef, invalidTC, []);
  },
  "Expected Output mismatch",
  "Rejects testcase with expectedOutput mismatch against returnType"
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 1 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
