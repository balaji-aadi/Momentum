import {
  OutputSerializerRegistry,
  PrimitiveSerializer,
  ArraySerializer,
  LinkedListSerializer,
  BinaryTreeSerializer,
  RandomListSerializer,
  GraphNodeSerializer,
  CycleDetectedError,
  ProblemConfigurationError,
  RuntimeSerializationError,
  UnsupportedSerializerTypeError
} from "../services/judge/outputSerializers/OutputSerializerRegistry.js";

import { ListNode, TreeNode, GraphNode } from "../services/judge/inputParsers/nodes.js";

console.log("===============================================================================");
console.log("  PHASE 4: OUTPUT SERIALIZER REGISTRY AUTOMATED TEST SUITE");
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
// GROUP 1: Individual Serializers & Return-Value Tests
// -----------------------------------------------------------------------------
console.log("[Group 1: Individual Serializers & Standard Return Values]");

// 1.1 PrimitiveSerializer
assert(PrimitiveSerializer.serialize(42) === 42, "1. Primitive: Number 42");
assert(PrimitiveSerializer.serialize(3.14159) === 3.14159, "1. Primitive: Float 3.14159");
assert(PrimitiveSerializer.serialize("hello world") === "hello world", "1. Primitive: String");
assert(PrimitiveSerializer.serialize(true) === true, "1. Primitive: Boolean true");
assert(PrimitiveSerializer.serialize(null) === null, "1. Primitive: Null returns null");
assert(PrimitiveSerializer.serialize(NaN) === null, "1. Primitive: NaN converts to null");

// 1.2 ArraySerializer
const arr1D = ArraySerializer.serialize([0, 1, 2]);
assert(JSON.stringify(arr1D) === "[0,1,2]", "2. Array: 1D Array [0,1,2]");

const mat2D = ArraySerializer.serialize([[1, 2], [3, 4]]);
assert(JSON.stringify(mat2D) === "[[1,2],[3,4]]", "3. Matrix: 2D Matrix [[1,2],[3,4]]");

// 1.3 LinkedListSerializer
const listHead = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const listRes = LinkedListSerializer.serialize(listHead);
assert(JSON.stringify(listRes) === "[1,2,3,4,5]", "4. LinkedList: Serializes 1->2->3->4->5 to [1,2,3,4,5]");

// 1.4 RandomListSerializer
const r1 = { val: 7, next: null, random: null };
const r2 = { val: 13, next: null, random: null };
const r3 = { val: 11, next: null, random: null };
r1.next = r2;
r2.next = r3;
r2.random = r1; // index 0
r3.random = null;
const randRes = RandomListSerializer.serialize(r1);
assert(JSON.stringify(randRes) === "[[7,null],[13,0],[11,null]]", "5. RandomList: Serializes RandomListNode chain with random pointers");

// 1.5 BinaryTreeSerializer (with trailing null trimming)
const treeRoot = new TreeNode(1, null, new TreeNode(2, new TreeNode(3), null));
const treeRes = BinaryTreeSerializer.serialize(treeRoot);
assert(JSON.stringify(treeRes) === "[1,null,2,3]", "6. BinaryTree: Serializes level-order tree and trims trailing nulls");

// 1.6 GraphNodeSerializer (Standard 1..V)
const g1 = new GraphNode(1);
const g2 = new GraphNode(2);
const g3 = new GraphNode(3);
const g4 = new GraphNode(4);
g1.neighbors = [g2, g4];
g2.neighbors = [g1, g3];
g3.neighbors = [g2, g4];
g4.neighbors = [g1, g3];
const graphRes = GraphNodeSerializer.serialize(g1);
assert(JSON.stringify(graphRes) === "[[2,4],[1,3],[2,4],[1,3]]", "7. GraphNode: Serializes standard 1..V graph to adjacency list");


// -----------------------------------------------------------------------------
// GROUP 2: In-Place Mutation & Void Return Tests
// -----------------------------------------------------------------------------
console.log("\n[Group 2: In-Place Mutation & Void Return Serialization]");

// 2.1 Void + Mutated Matrix (Rotate Image)
const pRotateDef = {
  functionName: "rotate",
  parameters: [{ name: "matrix", type: "number[][]" }],
  returnType: "void"
};
const pRotateProfile = { inPlaceMutation: true, mutatedParameter: "matrix" };
const rotatedMatrixPayload = {
  returnedValue: undefined,
  mutatedParameters: { matrix: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }
};
const rotateRes = OutputSerializerRegistry.serializeExecutionResult(rotatedMatrixPayload, pRotateDef, pRotateProfile);
assert(JSON.stringify(rotateRes) === "[[7,4,1],[8,5,2],[9,6,3]]", "8. Mutation: Serializes in-place mutated matrix");

// 2.2 Void + Mutated String
const pRevStrDef = {
  functionName: "reverseString",
  parameters: [{ name: "s", type: "string" }],
  returnType: "void"
};
const pRevStrProfile = { inPlaceMutation: true, mutatedParameter: "s" };
const revStrRes = OutputSerializerRegistry.serializeExecutionResult(
  { returnedValue: undefined, mutatedParameters: { s: "olleh" } },
  pRevStrDef,
  pRevStrProfile
);
assert(revStrRes === "olleh", "9. Mutation: Serializes in-place mutated string");

// 2.3 Void + Mutated Array (Sort Colors)
const pSortArrDef = {
  functionName: "sortColors",
  parameters: [{ name: "nums", type: "number[]" }],
  returnType: "void"
};
const pSortArrProfile = { inPlaceMutation: true, mutatedParameter: "nums" };
const sortArrRes = OutputSerializerRegistry.serializeExecutionResult(
  { returnedValue: undefined, mutatedParameters: { nums: [0, 0, 1, 1, 2, 2] } },
  pSortArrDef,
  pSortArrProfile
);
assert(JSON.stringify(sortArrRes) === "[0,0,1,1,2,2]", "10. Mutation: Serializes in-place mutated 1D array");

// 2.4 Void + Mutated ListNode
const pSortListDef = {
  functionName: "sortList",
  parameters: [{ name: "head", type: "ListNode" }],
  returnType: "void"
};
const pSortListProfile = { inPlaceMutation: true, mutatedParameter: "head" };
const sortedListHead = new ListNode(1, new ListNode(2, new ListNode(3)));
const sortListRes = OutputSerializerRegistry.serializeExecutionResult(
  { returnedValue: undefined, mutatedParameters: { head: sortedListHead } },
  pSortListDef,
  pSortListProfile
);
assert(JSON.stringify(sortListRes) === "[1,2,3]", "11. Mutation: Serializes in-place mutated ListNode");


// -----------------------------------------------------------------------------
// GROUP 3: Cycle Safety & Arbitrary Graph Values
// -----------------------------------------------------------------------------
console.log("\n[Group 3: Cycle Safety & Arbitrary Graph Values]");

// 3.1 Cyclic Linked List Rejection (Strict CycleDetectedError)
const cycleNode1 = new ListNode(1);
const cycleNode2 = new ListNode(2);
cycleNode1.next = cycleNode2;
cycleNode2.next = cycleNode1; // Cycle!

assertThrows(
  () => LinkedListSerializer.serialize(cycleNode1),
  "Unexpected cyclic reference detected",
  "12. Cycle Safety: Strictly throws CycleDetectedError on cyclic list"
);

// 3.2 Arbitrary Graph Node Values (e.g. 10, 20, 50)
const arb10 = new GraphNode(10);
const arb20 = new GraphNode(20);
const arb50 = new GraphNode(50);
arb10.neighbors = [arb20, arb50];
arb20.neighbors = [arb10];
arb50.neighbors = [arb10];

const arbGraphRes = GraphNodeSerializer.serialize(arb10);
assert(
  Array.isArray(arbGraphRes) &&
  arbGraphRes.length === 3 &&
  arbGraphRes[0].val === 10 &&
  arbGraphRes[0].neighbors.includes(20) &&
  arbGraphRes[0].neighbors.includes(50),
  "13. Arbitrary Graph: Handles arbitrary node values (10, 20, 50) cleanly"
);

// 3.3 Deterministic Graph Serialization
const arbGraphRes2 = GraphNodeSerializer.serialize(arb50); // Start from arb50
assert(
  arbGraphRes2[0].val === 10 && arbGraphRes2[1].val === 20 && arbGraphRes2[2].val === 50,
  "14. Deterministic Graph: Node output order is sorted deterministically regardless of entry point"
);


// -----------------------------------------------------------------------------
// GROUP 4: Null / Empty Structures & Extensibility
// -----------------------------------------------------------------------------
console.log("\n[Group 4: Null/Empty Structures & Extensibility]");

// 4.1 Null / Empty Structures
assert(JSON.stringify(ArraySerializer.serialize([])) === "[]", "15. Null/Empty: Empty array []");
assert(JSON.stringify(LinkedListSerializer.serialize(null)) === "[]", "15. Null/Empty: Null ListNode returns []");
assert(JSON.stringify(BinaryTreeSerializer.serialize(null)) === "[]", "15. Null/Empty: Null TreeNode returns []");
assert(JSON.stringify(GraphNodeSerializer.serialize(null)) === "[]", "15. Null/Empty: Null GraphNode returns []");

// 4.2 Custom Serializer Registration
const dummyTrieSerializer = {
  serialize: (trie) => trie.getAllWords()
};
OutputSerializerRegistry.register("TrieSerializer", dummyTrieSerializer);
const trieOutput = OutputSerializerRegistry.serialize({ getAllWords: () => ["cat", "car"] }, "TrieSerializer");
assert(JSON.stringify(trieOutput) === '["cat","car"]', "16. Extensibility: Registers and dispatches custom serializer");


// -----------------------------------------------------------------------------
// GROUP 5: Problem Configuration & Runtime Error Validation
// -----------------------------------------------------------------------------
console.log("\n[Group 5: Problem Configuration & Runtime Errors]");

// 5.1 Missing mutatedParameter in executionProfile
assertThrows(
  () => OutputSerializerRegistry.serializeExecutionResult({ returnedValue: undefined }, pRotateDef, { inPlaceMutation: true }),
  "requires 'executionProfile.mutatedParameter' to be explicitly defined",
  "17. Error: Rejects in-place mutation when mutatedParameter is missing"
);

// 5.2 Non-existent mutatedParameter
assertThrows(
  () => OutputSerializerRegistry.serializeExecutionResult(
    { returnedValue: undefined, mutatedParameters: { nonexistent: [] } },
    pRotateDef,
    { inPlaceMutation: true, mutatedParameter: "nonexistent" }
  ),
  "not found in functionDefinition parameters",
  "17. Error: Rejects non-existent mutatedParameter"
);

// 5.3 Missing runtime value for mutatedParameter
assertThrows(
  () => OutputSerializerRegistry.serializeExecutionResult(
    { returnedValue: undefined, mutatedParameters: {} },
    pRotateDef,
    pRotateProfile
  ),
  "Missing runtime value for mutated parameter 'matrix'",
  "17. Error: Rejects missing runtime value for mutated parameter"
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 4 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
