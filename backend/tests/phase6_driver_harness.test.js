import { DriverGeneratorService, UnsupportedLanguageError } from "../services/judge/driverGenerator/DriverGeneratorService.js";
import { generatePythonDriverHarness } from "../services/judge/driverGenerator/PythonDriverGenerator.js";
import { generateJavaScriptDriverHarness } from "../services/judge/driverGenerator/JavaScriptDriverGenerator.js";
import { generateCppDriverHarness } from "../services/judge/driverGenerator/CppDriverGenerator.js";
import { generateJavaDriverHarness } from "../services/judge/driverGenerator/JavaDriverGenerator.js";

console.log("===============================================================================");
console.log("  PHASE 6: UNIVERSAL DSA DRIVER HARNESS GENERATOR AUTOMATED TEST SUITE");
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
// 10 Representative DSA Problem Definitions
// -----------------------------------------------------------------------------
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

// Sample Test Cases
const sampleTCs = [
  { input: { nums: [2, 7, 11, 15], target: 9 } },
  { input: { nums: [3, 2, 4], target: 6 } }
];

// -----------------------------------------------------------------------------
// Group 1: Python Driver Harness Generation
// -----------------------------------------------------------------------------
console.log("[Group 1: Python Driver Harness Generation]");

const pyP1 = generatePythonDriverHarness("class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]", P1_TwoSum, {}, sampleTCs);
assert(pyP1.includes("class ListNode:") && pyP1.includes("class TreeNode:") && pyP1.includes("class Node:"), "1. Python: Injects standard node class definitions");
assert(pyP1.includes("class Solution:") && pyP1.includes("return [0, 1]"), "1. Python: Injects student code");
assert(pyP1.includes("solution = Solution()"), "1. Python: Instantiates Solution");
assert(pyP1.includes("result = solution.twoSum(*args)"), "1. Python: Invokes twoSum dynamically with multi-parameters");
assert(pyP1.includes('"status": "SUCCESS"') && pyP1.includes('"status": "RUNTIME_ERROR"'), "1. Python: Includes execution result envelope transport");

const pyP6 = generatePythonDriverHarness("class Solution:\n    def rotate(self, matrix):\n        pass", P6_RotateImage, P6_RotateProfile, [{ input: { matrix: [[1, 2], [3, 4]] } }]);
assert(pyP6.includes("solution.rotate(*args)") && pyP6.includes("output = serialize_output(args[mutated_idx])"), "1. Python: Captures mutated matrix parameter for in-place problem");

const pyP7 = generatePythonDriverHarness("class Solution:\n    def copyRandomList(self, head):\n        return head", P7_CopyRandomList, {}, []);
assert(pyP7.includes("parse_random_list_node"), "1. Python: Uses RandomListNode deserializer");

const pyP8 = generatePythonDriverHarness("class Solution:\n    def cloneGraph(self, node):\n        return node", P8_CloneGraph, {}, []);
assert(pyP8.includes("parse_graph_node"), "1. Python: Uses GraphNode deserializer");

// -----------------------------------------------------------------------------
// Group 2: JavaScript Driver Harness Generation
// -----------------------------------------------------------------------------
console.log("\n[Group 2: JavaScript Driver Harness Generation]");

const jsP1 = generateJavaScriptDriverHarness("var twoSum = function(nums, target) { return [0, 1]; };", P1_TwoSum, {}, sampleTCs);
assert(jsP1.includes("function ListNode") && jsP1.includes("function TreeNode") && jsP1.includes("function Node"), "2. JS: Injects standard node constructors");
assert(jsP1.includes("var twoSum = function"), "2. JS: Injects student code");
assert(jsP1.includes("const result = twoSum(...args);"), "2. JS: Invokes official function contract twoSum(...args)");
assert(jsP1.includes('status: "SUCCESS"') && jsP1.includes('status: "RUNTIME_ERROR"'), "2. JS: Includes execution result envelope transport");

const jsP6 = generateJavaScriptDriverHarness("var rotate = function(matrix) {};", P6_RotateImage, P6_RotateProfile, [{ input: { matrix: [[1, 2], [3, 4]] } }]);
assert(jsP6.includes("rotate(...args);") && jsP6.includes("output = serializeOutput(args[mutatedIdx]);"), "2. JS: Captures in-place mutated matrix parameter");

// -----------------------------------------------------------------------------
// Group 3: C++ Driver Harness Generation
// -----------------------------------------------------------------------------
console.log("\n[Group 3: C++ Driver Harness Generation]");

const cppP1 = generateCppDriverHarness("class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {0, 1}; } };", P1_TwoSum, {}, sampleTCs);
assert(cppP1.includes("#include <iostream>") && cppP1.includes("#include <vector>") && cppP1.includes("#include <queue>"), "3. C++: Includes standard headers");
assert(cppP1.includes("struct ListNode") && cppP1.includes("struct TreeNode") && cppP1.includes("class Node"), "3. C++: Injects standard struct definitions");
assert(cppP1.includes("string escape_json_string(const string& s)"), "3. C++: Includes safe JSON string escaping");
assert(cppP1.includes("class Solution"), "3. C++: Injects student code");
assert(cppP1.includes('cout << "{\\"status\\":\\"SUCCESS\\"'), "3. C++: Emits JSON execution result envelope");

// -----------------------------------------------------------------------------
// Group 4: Java Driver Harness Generation
// -----------------------------------------------------------------------------
console.log("\n[Group 4: Java Driver Harness Generation]");

const javaP1 = generateJavaDriverHarness("class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; } }", P1_TwoSum, {}, sampleTCs);
assert(javaP1.includes("import java.util.*;") && javaP1.includes("import java.io.*;"), "4. Java: Includes standard imports");
assert(javaP1.includes("class ListNode") && javaP1.includes("class TreeNode") && javaP1.includes("class Node"), "4. Java: Injects standard node class definitions");
assert(javaP1.includes("public static String escapeJson(String s)"), "4. Java: Includes safe JSON string escaping");
assert(javaP1.includes("public class Main"), "4. Java: Declares public class Main runner");
assert(javaP1.includes('System.out.println("{\\"status\\":\\"SUCCESS\\"'), "4. Java: Emits JSON execution result envelope");

// -----------------------------------------------------------------------------
// Group 5: Universal DriverGeneratorService Routing & Rejections
// -----------------------------------------------------------------------------
console.log("\n[Group 5: Universal Routing & Error Handling]");

const routerPy = DriverGeneratorService.generateDriverHarness("python", "code", P1_TwoSum, {}, []);
assert(routerPy.includes("solution = Solution()"), "5. DriverGeneratorService: Dispatches python");

const routerJs = DriverGeneratorService.generateDriverHarness("javascript", "code", P1_TwoSum, {}, []);
assert(routerJs.includes("function ListNode"), "5. DriverGeneratorService: Dispatches javascript");

const routerCpp = DriverGeneratorService.generateDriverHarness("cpp", "code", P1_TwoSum, {}, []);
assert(routerCpp.includes("#include <iostream>"), "5. DriverGeneratorService: Dispatches cpp");

const routerJava = DriverGeneratorService.generateDriverHarness("java", "code", P1_TwoSum, {}, []);
assert(routerJava.includes("public class Main"), "5. DriverGeneratorService: Dispatches java");

assertThrows(
  () => DriverGeneratorService.generateDriverHarness("ruby", "code", P1_TwoSum, {}, []),
  "unsupported language",
  "5. Rejects unsupported language with UnsupportedLanguageError"
);

assertThrows(
  () => generatePythonDriverHarness("code", P6_RotateImage, { inPlaceMutation: true }, []),
  "missing required 'executionprofile.mutatedparameter'",
  "5. Rejects in-place mutation without mutatedParameter with ProblemConfigurationError"
);

assertThrows(
  () => generatePythonDriverHarness("code", P6_RotateImage, { inPlaceMutation: true, mutatedParameter: "nonExistent" }, []),
  "not found in functiondefinition parameters",
  "5. Rejects non-existent mutatedParameter with ProblemConfigurationError"
);

// -----------------------------------------------------------------------------
// Group 6: Cross-Language Wire Format Consistency
// -----------------------------------------------------------------------------
console.log("\n[Group 6: Cross-Language Canonical Wire Format Consistency]");

assert(pyP1.includes("CycleDetectedError") && jsP1.includes("CycleDetectedError") && cppP1.includes("CycleDetectedError") && javaP1.includes("CycleDetectedError"), "6. All 4 languages enforce CycleDetectedError on cyclic linked lists");
assert(pyP1.includes("res.pop()") && jsP1.includes("res.pop()") && cppP1.includes("res.pop_back()") && javaP1.includes("list.remove"), "6. All 4 languages implement trailing-null trimming for TreeNode outputs");

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 6 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
