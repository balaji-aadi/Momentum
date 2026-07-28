import { 
  generatePythonTemplate, 
  generateJavaScriptTemplate, 
  generateCppTemplate, 
  generateJavaTemplate, 
  generateStarterCode 
} from "../../shared/templateGenerator.js";

console.log("=== Running Universal Execution Engine TemplateGenerator Unit Tests ===");

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

// 1. Two Sum Function Definition Test
const fnTwoSum = {
  functionName: "twoSum",
  parameters: [
    { name: "nums", type: "number[]" },
    { name: "target", type: "number" }
  ],
  returnType: "number[]"
};

// Python Test
const pyTwoSum = generatePythonTemplate(fnTwoSum);
assert(pyTwoSum.includes("def twoSum(self, nums: List[int], target: int) -> List[int]:"), "Python twoSum signature generated correctly");
assert(pyTwoSum.includes("from typing import List"), "Python typing import included");

// JavaScript Test
const jsTwoSum = generateJavaScriptTemplate(fnTwoSum);
assert(jsTwoSum.includes("var twoSum = function(nums, target) {"), "JavaScript twoSum signature generated correctly");
assert(jsTwoSum.includes("@param {number[]} nums"), "JSDoc param type annotation included");

// C++ Test
const cppTwoSum = generateCppTemplate(fnTwoSum);
assert(cppTwoSum.includes("vector<int> twoSum(vector<int>& nums, int target)"), "C++ twoSum vector reference signature generated correctly");

// Java Test
const javaTwoSum = generateJavaTemplate(fnTwoSum);
assert(javaTwoSum.includes("public int[] twoSum(int[] nums, int target)"), "Java twoSum array signature generated correctly");

// 2. Struct Linked List Test (ListNode)
const fnListNode = {
  functionName: "reverseList",
  parameters: [
    { name: "head", type: "ListNode" }
  ],
  returnType: "ListNode"
};

const pyListNode = generatePythonTemplate(fnListNode);
assert(pyListNode.includes("def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:"), "Python ListNode signature generated correctly");

const cppListNode = generateCppTemplate(fnListNode);
assert(cppListNode.includes("ListNode* reverseList(ListNode* head)"), "C++ ListNode pointer signature generated correctly");

// 3. Main Dispatcher Test
const pyDispatched = generateStarterCode("python", fnTwoSum);
assert(pyDispatched.includes("def twoSum"), "Main generateStarterCode dispatches to Python template generator");

console.log(`\nTemplateGenerator Test Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
