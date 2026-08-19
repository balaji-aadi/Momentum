import { 
  InputParserRegistry,
  PrimitiveParser,
  ArrayParser,
  MatrixParser,
  LinkedListParser,
  RandomListParser,
  BinaryTreeParser,
  GraphParser,
  validateIR,
  InputParserError,
  UnsupportedParameterTypeError,
  IRValidationError
} from "../services/judge/inputParsers/InputParserRegistry.js";

console.log("===============================================================================");
console.log("  PHASE 3: INPUT PARSER REGISTRY & LANGUAGE-NEUTRAL IR TEST SUITE");
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
// GROUP 1: Individual Parsers & Language-Neutral IR Generation
// -----------------------------------------------------------------------------
console.log("[Group 1: Individual Parsers & Language-Neutral IR Generation]");

// 1.1 PrimitiveParser
const pNum = PrimitiveParser.parse(42, "number", "target");
assert(pNum.kind === "primitive" && pNum.type === "number" && pNum.value === 42, "PrimitiveParser produces valid PrimitiveIR for number");

const pStr = PrimitiveParser.parse("hello", "string", "s");
assert(pStr.kind === "primitive" && pStr.type === "string" && pStr.value === "hello", "PrimitiveParser produces valid PrimitiveIR for string");

const pBool = PrimitiveParser.parse(true, "boolean", "flag");
assert(pBool.kind === "primitive" && pBool.type === "boolean" && pBool.value === true, "PrimitiveParser produces valid PrimitiveIR for boolean");

// Strict: Rejects string for number without silent coercion
assertThrows(
  () => PrimitiveParser.parse("42", "number", "target"),
  "Expected number, received string",
  "PrimitiveParser strictly rejects string '42' for number parameter (no silent coercion)"
);

// 1.2 ArrayParser
const pArr = ArrayParser.parse([2, 7, 11, 15], "number[]", "nums");
assert(pArr.kind === "array" && pArr.itemType === "number" && pArr.elements.length === 4, "ArrayParser produces valid ArrayIR");

const pEmptyArr = ArrayParser.parse([], "string[]", "words");
assert(pEmptyArr.kind === "array" && pEmptyArr.elements.length === 0, "ArrayParser handles empty array []");

assertThrows(
  () => ArrayParser.parse([1, "two", 3], "number[]", "nums"),
  "Expected number, received string",
  "ArrayParser rejects mixed type elements"
);

// 1.3 MatrixParser
const pMat = MatrixParser.parse([[1, 2], [3, 4]], "number[][]", "grid");
assert(pMat.kind === "matrix" && pMat.dimensions.rows === 2 && pMat.dimensions.cols === 2, "MatrixParser produces valid MatrixIR for square grid");

const pRectMat = MatrixParser.parse([[1, 2, 3, 4], [5, 6, 7, 8]], "number[][]", "grid");
assert(pRectMat.dimensions.rows === 2 && pRectMat.dimensions.cols === 4, "MatrixParser produces valid MatrixIR for rectangular grid (2x4)");

const pEmptyMat = MatrixParser.parse([], "number[][]", "grid");
assert(pEmptyMat.dimensions.rows === 0 && pEmptyMat.dimensions.cols === 0, "MatrixParser handles empty matrix []");

// Ragged matrix rejection
assertThrows(
  () => MatrixParser.parse([[1, 2], [3]], "number[][]", "grid"),
  "ragged matrix rejected",
  "MatrixParser strictly rejects ragged/jagged matrices"
);

// 1.4 LinkedListParser
const pList = LinkedListParser.parse([1, 2, 3, 4, 5], "ListNode", "head");
assert(pList.kind === "linked_list" && pList.nodeType === "ListNode" && pList.values.length === 5, "LinkedListParser produces valid LinkedListIR");

const pEmptyList = LinkedListParser.parse(null, "ListNode", "head");
assert(pEmptyList.kind === "linked_list" && pEmptyList.length === 0, "LinkedListParser produces empty LinkedListIR for null");

// 1.5 RandomListParser
const pRand = RandomListParser.parse([[7, null], [13, 0], [11, 1]], "RandomListNode", "head");
assert(pRand.kind === "random_list" && pRand.nodes.length === 3 && pRand.nodes[1].randomIndex === 0, "RandomListParser produces valid RandomListIR");

assertThrows(
  () => RandomListParser.parse([[7, 99]], "RandomListNode", "head"),
  "out of bounds",
  "RandomListParser rejects out-of-bounds random pointer index"
);

// 1.6 BinaryTreeParser
const pTree = BinaryTreeParser.parse([1, null, 2, 3], "TreeNode", "root");
assert(pTree.kind === "binary_tree" && pTree.nodeType === "TreeNode" && pTree.nodeCount === 3, "BinaryTreeParser produces valid BinaryTreeIR");

const pSingleTree = BinaryTreeParser.parse([42], "TreeNode", "root");
assert(pSingleTree.nodeCount === 1 && pSingleTree.bfsOrder[0] === 42, "BinaryTreeParser handles single-node tree");

// 1.7 GraphParser
const pGraph = GraphParser.parse([[2, 4], [1, 3], [2, 4], [1, 3]], "GraphNode", "node");
assert(pGraph.kind === "graph_node" && pGraph.vertexCount === 4 && pGraph.adjacencyList[0][0] === 2, "GraphParser produces valid GraphNodeIR");

assertThrows(
  () => GraphParser.parse([[2, 99]], "GraphNode", "node"),
  "out of graph bounds",
  "GraphParser rejects out-of-bounds neighbor vertex index"
);


// -----------------------------------------------------------------------------
// GROUP 2: Canonical Named-Parameter Multi-Parameter Parsing
// -----------------------------------------------------------------------------
console.log("\n[Group 2: Multi-Parameter Canonical Test Case Parsing (10 Representative DSA Problems)]");

// Problem 1: Two Sum (nums: number[], target: number)
const p1Def = {
  functionName: "twoSum",
  parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }]
};
const p1Input = { nums: [2, 7, 11, 15], target: 9 };
const p1IR = InputParserRegistry.parseTestCase(p1Def, p1Input);
assert(p1IR.nums.kind === "array" && p1IR.target.kind === "primitive" && p1IR.target.value === 9, "P1 TwoSum: Multi-parameter IR parsed correctly");

// Problem 2: Reverse Linked List (head: ListNode)
const p2Def = { functionName: "reverseList", parameters: [{ name: "head", type: "ListNode" }] };
const p2IR = InputParserRegistry.parseTestCase(p2Def, { head: [1, 2, 3, 4, 5] });
assert(p2IR.head.kind === "linked_list" && p2IR.head.length === 5, "P2 ReverseList: LinkedListIR parsed");

// Problem 3: Add Two Numbers (l1: ListNode, l2: ListNode)
const p3Def = {
  functionName: "addTwoNumbers",
  parameters: [{ name: "l1", type: "ListNode" }, { name: "l2", type: "ListNode" }]
};
const p3IR = InputParserRegistry.parseTestCase(p3Def, { l1: [2, 4, 3], l2: [5, 6, 4] });
assert(p3IR.l1.kind === "linked_list" && p3IR.l2.kind === "linked_list", "P3 AddTwoNumbers: 2 LinkedListIRs parsed");

// Problem 4: Invert Binary Tree (root: TreeNode)
const p4Def = { functionName: "invertTree", parameters: [{ name: "root", type: "TreeNode" }] };
const p4IR = InputParserRegistry.parseTestCase(p4Def, { root: [4, 2, 7, 1, 3, 6, 9] });
assert(p4IR.root.kind === "binary_tree" && p4IR.root.nodeCount === 7, "P4 InvertTree: BinaryTreeIR parsed");

// Problem 5: Maximum Depth of Binary Tree (root: TreeNode)
const p5Def = { functionName: "maxDepth", parameters: [{ name: "root", type: "TreeNode" }] };
const p5IR = InputParserRegistry.parseTestCase(p5Def, { root: [3, 9, 20, null, null, 15, 7] });
assert(p5IR.root.kind === "binary_tree" && p5IR.root.nodeCount === 5, "P5 MaxDepth: BinaryTreeIR with nulls parsed");

// Problem 6: Number of Islands (grid: number[][])
const p6Def = { functionName: "numIslands", parameters: [{ name: "grid", type: "number[][]" }] };
const p6IR = InputParserRegistry.parseTestCase(p6Def, { grid: [[1, 1, 0], [1, 0, 0], [0, 0, 1]] });
assert(p6IR.grid.kind === "matrix" && p6IR.grid.dimensions.rows === 3 && p6IR.grid.dimensions.cols === 3, "P6 NumIslands: MatrixIR parsed");

// Problem 7: Rotate Image (matrix: number[][])
const p7Def = { functionName: "rotate", parameters: [{ name: "matrix", type: "number[][]" }] };
const p7IR = InputParserRegistry.parseTestCase(p7Def, { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] });
assert(p7IR.matrix.kind === "matrix" && p7IR.matrix.dimensions.rows === 3, "P7 Rotate: MatrixIR parsed");

// Problem 8: Copy List with Random Pointer (head: RandomListNode)
const p8Def = { functionName: "copyRandomList", parameters: [{ name: "head", type: "RandomListNode" }] };
const p8IR = InputParserRegistry.parseTestCase(p8Def, { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] });
assert(p8IR.head.kind === "random_list" && p8IR.head.length === 5, "P8 CopyRandomList: RandomListIR parsed");

// Problem 9: Clone Graph (node: GraphNode)
const p9Def = { functionName: "cloneGraph", parameters: [{ name: "node", type: "GraphNode" }] };
const p9IR = InputParserRegistry.parseTestCase(p9Def, { node: [[2, 4], [1, 3], [2, 4], [1, 3]] });
assert(p9IR.node.kind === "graph_node" && p9IR.node.vertexCount === 4, "P9 CloneGraph: GraphNodeIR parsed");

// Problem 10: Multi-Parameter String Search (s: string, words: string[], k: number)
const p10Def = {
  functionName: "findSubstring",
  parameters: [{ name: "s", type: "string" }, { name: "words", type: "string[]" }, { name: "k", type: "number" }]
};
const p10IR = InputParserRegistry.parseTestCase(p10Def, { s: "barfoothefoobarman", words: ["foo", "bar"], k: 3 });
assert(p10IR.s.kind === "primitive" && p10IR.words.kind === "array" && p10IR.k.kind === "primitive", "P10 MultiParam: 3 IRs (Primitive, Array, Primitive) parsed");


// -----------------------------------------------------------------------------
// GROUP 3: IR Invariant Validation & Normalization
// -----------------------------------------------------------------------------
console.log("\n[Group 3: IR Invariant Validation]");

// 3.1 Normalizes valid IR
const rawIR = { kind: "primitive", type: "number", value: 100 };
const validatedIR = validateIR(rawIR);
assert(validatedIR.value === 100, "validateIR passes valid PrimitiveIR");

// 3.2 Rejects missing kind
assertThrows(() => validateIR({ type: "number", value: 100 }), "must have a valid 'kind'", "validateIR rejects IR without kind");

// 3.3 Rejects unknown kind
assertThrows(() => validateIR({ kind: "unknown_weird_kind" }), "Unrecognized IR kind", "validateIR rejects unknown kind");


// -----------------------------------------------------------------------------
// GROUP 4: Unsupported Type & Extensibility
// -----------------------------------------------------------------------------
console.log("\n[Group 4: Unsupported Type & Custom Extensibility]");

// 4.1 Rejects unknown type with UnsupportedParameterTypeError (No silent fallback)
assertThrows(
  () => InputParserRegistry.parseParameter("data", "UnregisteredCustomType", "myParam"),
  "Parameter type 'UnregisteredCustomType' for parameter 'myParam' is not supported",
  "InputParserRegistry strictly throws UnsupportedParameterTypeError (Zero silent fallback)"
);

// 4.2 Custom Parser Registration
const dummyTrieParser = {
  parse: (val, type, paramName) => ({
    kind: "trie_node",
    isCustom: true,
    words: val
  })
};

InputParserRegistry.register("TrieNode", dummyTrieParser);
const trieIR = InputParserRegistry.parseParameter(["apple", "app"], "TrieNode", "root");
assert(trieIR.kind === "trie_node" && trieIR.words.length === 2, "InputParserRegistry seamlessly accepts and dispatches registered custom parser");


// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 3 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
