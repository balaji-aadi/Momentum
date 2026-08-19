import {
  generatePythonTemplate,
  generateJavaScriptTemplate,
  generateCppTemplate,
  generateJavaTemplate,
  generateStarterCode,
  generateAllStarterTemplates,
  normalizeCanonicalType,
  TYPE_MAP,
  STRUCT_HEADERS
} from "../../shared/templateGenerator.js";

import { validateStarterCodeOverrides } from "../services/problem-service/problem.validator.js";

console.log("===============================================================================");
console.log("  PHASE 2: TEMPLATE GENERATION ENGINE AUTOMATED TEST SUITE");
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
// GROUP 1: Canonical Data Structure Type Normalization
// -----------------------------------------------------------------------------
console.log("[Group 1: Canonical Type Normalization]");

assert(normalizeCanonicalType("ListNode") === "ListNode", "Normalizes 'ListNode'");
assert(normalizeCanonicalType("linkedlist") === "ListNode", "Normalizes 'linkedlist' -> 'ListNode'");
assert(normalizeCanonicalType("RandomListNode") === "RandomListNode", "Normalizes 'RandomListNode'");
assert(normalizeCanonicalType("TreeNode") === "TreeNode", "Normalizes 'TreeNode'");
assert(normalizeCanonicalType("binarytree") === "TreeNode", "Normalizes 'binarytree' -> 'TreeNode'");
assert(normalizeCanonicalType("GraphNode") === "GraphNode", "Normalizes 'GraphNode'");
assert(normalizeCanonicalType("Graph") === "GraphNode", "Normalizes 'Graph' -> 'GraphNode'");
assert(normalizeCanonicalType("graph_node") === "GraphNode", "Normalizes 'graph_node' -> 'GraphNode'");

// -----------------------------------------------------------------------------
// 10 REPRESENTATIVE DSA PROBLEMS CONTRACT VERIFICATION
// -----------------------------------------------------------------------------

// ==================== PROBLEM 1: Two Sum ====================
console.log("\n[Problem 1: Two Sum - Array + Primitive -> Array]");
const p1TwoSum = {
  functionName: "twoSum",
  parameters: [
    { name: "nums", type: "number[]" },
    { name: "target", type: "number" }
  ],
  returnType: "number[]"
};

// Python Contract
const py1 = generatePythonTemplate(p1TwoSum);
assert(py1.startsWith("from typing import List, Optional\n\nclass Solution:"), "P1 Python: Valid import and class structure");
assert(py1.includes("def twoSum(self, nums: List[int], target: int) -> List[int]:"), "P1 Python: Exact signature");
assert(py1.trim().endsWith("pass"), "P1 Python: Ends with pass");

// JavaScript Contract
const js1 = generateJavaScriptTemplate(p1TwoSum);
assert(js1.includes("@param {number[]} nums"), "P1 JS: JSDoc array param");
assert(js1.includes("@param {number} target"), "P1 JS: JSDoc primitive param");
assert(js1.includes("@return {number[]}"), "P1 JS: JSDoc return");
assert(js1.includes("var twoSum = function(nums, target) {"), "P1 JS: Exact function signature");
assert(js1.trim().endsWith("};"), "P1 JS: Valid closing");

// C++ Contract
const cpp1 = generateCppTemplate(p1TwoSum);
assert(cpp1.includes("class Solution {"), "P1 C++: class Solution");
assert(cpp1.includes("vector<int> twoSum(vector<int>& nums, int target)"), "P1 C++: vector ref param & int param");
assert(cpp1.trim().endsWith("};"), "P1 C++: Valid closing syntax");

// Java Contract
const java1 = generateJavaTemplate(p1TwoSum);
assert(java1.includes("class Solution {"), "P1 Java: class Solution");
assert(java1.includes("public int[] twoSum(int[] nums, int target)"), "P1 Java: public int[] signature");
assert(java1.trim().endsWith("}"), "P1 Java: Valid closing syntax");


// ==================== PROBLEM 2: Reverse Linked List ====================
console.log("\n[Problem 2: Reverse Linked List - ListNode -> ListNode]");
const p2ReverseList = {
  functionName: "reverseList",
  parameters: [{ name: "head", type: "ListNode" }],
  returnType: "ListNode"
};

const py2 = generatePythonTemplate(p2ReverseList);
assert(py2.includes("# Definition for singly-linked list."), "P2 Python: Includes ListNode header");
assert(py2.includes("def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:"), "P2 Python: Optional[ListNode] signature");

const js2 = generateJavaScriptTemplate(p2ReverseList);
assert(js2.includes("* Definition for singly-linked list."), "P2 JS: Includes ListNode JSDoc header");
assert(js2.includes("var reverseList = function(head) {"), "P2 JS: Exact signature");

const cpp2 = generateCppTemplate(p2ReverseList);
assert(cpp2.includes("struct ListNode {"), "P2 C++: Includes ListNode struct definition header");
assert(cpp2.includes("ListNode* reverseList(ListNode* head)"), "P2 C++: ListNode* pointer signature");

const java2 = generateJavaTemplate(p2ReverseList);
assert(java2.includes("public class ListNode {"), "P2 Java: Includes ListNode class definition header");
assert(java2.includes("public ListNode reverseList(ListNode head)"), "P2 Java: ListNode return and param signature");


// ==================== PROBLEM 3: Add Two Numbers ====================
console.log("\n[Problem 3: Add Two Numbers - 2 ListNode params -> ListNode]");
const p3AddTwoNumbers = {
  functionName: "addTwoNumbers",
  parameters: [
    { name: "l1", type: "ListNode" },
    { name: "l2", type: "ListNode" }
  ],
  returnType: "ListNode"
};

const py3 = generatePythonTemplate(p3AddTwoNumbers);
assert(py3.includes("def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:"), "P3 Python: 2 Optional[ListNode] params");

const cpp3 = generateCppTemplate(p3AddTwoNumbers);
assert(cpp3.includes("ListNode* addTwoNumbers(ListNode* l1, ListNode* l2)"), "P3 C++: 2 ListNode* pointer params");

const java3 = generateJavaTemplate(p3AddTwoNumbers);
assert(java3.includes("public ListNode addTwoNumbers(ListNode l1, ListNode l2)"), "P3 Java: 2 ListNode params");


// ==================== PROBLEM 4: Invert Binary Tree ====================
console.log("\n[Problem 4: Invert Binary Tree - TreeNode -> TreeNode]");
const p4InvertTree = {
  functionName: "invertTree",
  parameters: [{ name: "root", type: "TreeNode" }],
  returnType: "TreeNode"
};

const py4 = generatePythonTemplate(p4InvertTree);
assert(py4.includes("# Definition for a binary tree node."), "P4 Python: Includes TreeNode header");
assert(py4.includes("def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:"), "P4 Python: Optional[TreeNode] signature");

const cpp4 = generateCppTemplate(p4InvertTree);
assert(cpp4.includes("struct TreeNode {"), "P4 C++: Includes TreeNode struct header");
assert(cpp4.includes("TreeNode* invertTree(TreeNode* root)"), "P4 C++: TreeNode* signature");

const java4 = generateJavaTemplate(p4InvertTree);
assert(java4.includes("public class TreeNode {"), "P4 Java: Includes TreeNode class header");
assert(java4.includes("public TreeNode invertTree(TreeNode root)"), "P4 Java: TreeNode signature");


// ==================== PROBLEM 5: Maximum Depth of Binary Tree ====================
console.log("\n[Problem 5: Max Depth - TreeNode -> number]");
const p5MaxDepth = {
  functionName: "maxDepth",
  parameters: [{ name: "root", type: "TreeNode" }],
  returnType: "number"
};

const py5 = generatePythonTemplate(p5MaxDepth);
assert(py5.includes("def maxDepth(self, root: Optional[TreeNode]) -> int:"), "P5 Python: TreeNode -> int signature");

const cpp5 = generateCppTemplate(p5MaxDepth);
assert(cpp5.includes("int maxDepth(TreeNode* root)"), "P5 C++: int maxDepth(TreeNode*) signature");


// ==================== PROBLEM 6: Number of Islands ====================
console.log("\n[Problem 6: Number of Islands - 2D Matrix (number[][]) -> number]");
const p6NumIslands = {
  functionName: "numIslands",
  parameters: [{ name: "grid", type: "number[][]" }],
  returnType: "number"
};

const py6 = generatePythonTemplate(p6NumIslands);
assert(py6.includes("def numIslands(self, grid: List[List[int]]) -> int:"), "P6 Python: List[List[int]] -> int signature");

const cpp6 = generateCppTemplate(p6NumIslands);
assert(cpp6.includes("int numIslands(vector<vector<int>>& grid)"), "P6 C++: 2D vector reference signature");

const java6 = generateJavaTemplate(p6NumIslands);
assert(java6.includes("public int numIslands(int[][] grid)"), "P6 Java: int[][] grid signature");


// ==================== PROBLEM 7: Rotate Image (In-Place Mutation) ====================
console.log("\n[Problem 7: Rotate Image - In-Place Mutation (void return)]");
const p7Rotate = {
  functionName: "rotate",
  parameters: [{ name: "matrix", type: "number[][]" }],
  returnType: "void"
};
const p7Profile = {
  inPlaceMutation: true,
  mutatedParameter: "matrix"
};

const py7 = generatePythonTemplate(p7Rotate, p7Profile);
assert(py7.includes("def rotate(self, matrix: List[List[int]]) -> None:"), "P7 Python: -> None return");
assert(py7.includes("# Do not return anything, modify matrix in-place instead."), "P7 Python: In-place mutation instruction comment");

const js7 = generateJavaScriptTemplate(p7Rotate, p7Profile);
assert(js7.includes("// Do not return anything, modify matrix in-place instead."), "P7 JS: In-place mutation instruction comment");

const cpp7 = generateCppTemplate(p7Rotate, p7Profile);
assert(cpp7.includes("void rotate(vector<vector<int>>& matrix)"), "P7 C++: void rotate(vector<vector<int>>& matrix) signature");
assert(cpp7.includes("// Do not return anything, modify matrix in-place instead."), "P7 C++: In-place instruction comment");

const java7 = generateJavaTemplate(p7Rotate, p7Profile);
assert(java7.includes("public void rotate(int[][] matrix)"), "P7 Java: public void rotate signature");
assert(java7.includes("// Do not return anything, modify matrix in-place instead."), "P7 Java: In-place instruction comment");


// ==================== PROBLEM 8: Copy List with Random Pointer ====================
console.log("\n[Problem 8: Copy List with Random Pointer - RandomListNode -> RandomListNode]");
const p8CopyRandom = {
  functionName: "copyRandomList",
  parameters: [{ name: "head", type: "RandomListNode" }],
  returnType: "RandomListNode"
};

const py8 = generatePythonTemplate(p8CopyRandom);
assert(py8.includes("class Node:"), "P8 Python: Includes Node with random definition");
assert(py8.includes("def copyRandomList(self, head: Optional['Node']) -> Optional['Node']:"), "P8 Python: Optional['Node'] signature");

const cpp8 = generateCppTemplate(p8CopyRandom);
assert(cpp8.includes("class Node {"), "P8 C++: Includes Node with next and random");
assert(cpp8.includes("Node* copyRandomList(Node* head)"), "P8 C++: Node* signature");

const java8 = generateJavaTemplate(p8CopyRandom);
assert(java8.includes("class Node {"), "P8 Java: Includes Node definition");
assert(java8.includes("public Node copyRandomList(Node head)"), "P8 Java: Node copyRandomList signature");


// ==================== PROBLEM 9: Clone Graph ====================
console.log("\n[Problem 9: Clone Graph - GraphNode -> GraphNode]");
const p9CloneGraph = {
  functionName: "cloneGraph",
  parameters: [{ name: "node", type: "GraphNode" }],
  returnType: "GraphNode"
};

const py9 = generatePythonTemplate(p9CloneGraph);
assert(py9.includes("def __init__(self, val = 0, neighbors = None):"), "P9 Python: Includes Node with neighbors definition");
assert(py9.includes("def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:"), "P9 Python: Optional['Node'] cloneGraph signature");

const cpp9 = generateCppTemplate(p9CloneGraph);
assert(cpp9.includes("vector<Node*> neighbors;"), "P9 C++: Includes Node with vector<Node*> neighbors");
assert(cpp9.includes("Node* cloneGraph(Node* node)"), "P9 C++: Node* cloneGraph signature");

const java9 = generateJavaTemplate(p9CloneGraph);
assert(java9.includes("public List<Node> neighbors;"), "P9 Java: Includes Node with List<Node> neighbors");
assert(java9.includes("public Node cloneGraph(Node node)"), "P9 Java: Node cloneGraph signature");


// ==================== PROBLEM 10: Multi-Parameter Search ====================
console.log("\n[Problem 10: Multi-Parameter String Search]");
const p10MultiParam = {
  functionName: "findSubstring",
  parameters: [
    { name: "s", type: "string" },
    { name: "words", type: "string[]" },
    { name: "k", type: "number" }
  ],
  returnType: "number[]"
};

const py10 = generatePythonTemplate(p10MultiParam);
assert(py10.includes("def findSubstring(self, s: str, words: List[str], k: int) -> List[int]:"), "P10 Python: Multi-param typed signature");

const js10 = generateJavaScriptTemplate(p10MultiParam);
assert(js10.includes("var findSubstring = function(s, words, k) {"), "P10 JS: Multi-param function signature");

const cpp10 = generateCppTemplate(p10MultiParam);
assert(cpp10.includes("vector<int> findSubstring(string& s, vector<string>& words, int k)"), "P10 C++: Ref passing for string & vector");

const java10 = generateJavaTemplate(p10MultiParam);
assert(java10.includes("public int[] findSubstring(String s, String[] words, int k)"), "P10 Java: Multi-param java signature");


// -----------------------------------------------------------------------------
// GROUP 3: Template Override Validation Tests
// -----------------------------------------------------------------------------
console.log("\n[Group 3: Template Override Validation]");

// 3.1 Valid Override
try {
  validateStarterCodeOverrides([
    { language: "python", code: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # custom admin note\n        pass\n" }
  ], p1TwoSum);
  assert(true, "Accepts valid manual starter code override");
} catch (e) {
  assert(false, `Valid override failed: ${e.message}`);
}

// 3.2 Override Missing Function Name
assertThrows(
  () => validateStarterCodeOverrides([
    { language: "python", code: "class Solution:\n    def wrongFunctionName(self, nums, target):\n        pass\n" }
  ], p1TwoSum),
  "does not contain declared function name 'twoSum'",
  "Rejects override missing declared function name"
);

// 3.3 Override Missing Parameter Name
assertThrows(
  () => validateStarterCodeOverrides([
    { language: "python", code: "class Solution:\n    def twoSum(self, nums):\n        pass\n" } // missing target
  ], p1TwoSum),
  "is missing required parameter 'target'",
  "Rejects override missing declared parameter"
);


// -----------------------------------------------------------------------------
// GROUP 4: Failure Handling (Unsupported Language)
// -----------------------------------------------------------------------------
console.log("\n[Group 4: Failure Handling]");

assertThrows(
  () => generateStarterCode("rust", p1TwoSum),
  "Language 'rust' is not supported",
  "Throws UnsupportedLanguageError for unsupported language"
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 2 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
