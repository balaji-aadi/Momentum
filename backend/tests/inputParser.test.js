import { InputParserRegistry } from "../services/judge/inputParsers/InputParserRegistry.js";
import { PrimitiveParser } from "../services/judge/inputParsers/PrimitiveParser.js";
import { ArrayParser } from "../services/judge/inputParsers/ArrayParser.js";
import { MatrixParser } from "../services/judge/inputParsers/MatrixParser.js";
import { LinkedListParser } from "../services/judge/inputParsers/LinkedListParser.js";
import { BinaryTreeParser } from "../services/judge/inputParsers/BinaryTreeParser.js";
import { GraphParser } from "../services/judge/inputParsers/GraphParser.js";

console.log("=== Running Universal Execution Engine InputParserRegistry Unit Tests ===");

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

// 1. PrimitiveParser Tests
const numVal = PrimitiveParser.parse("42", "number");
assert(numVal === 42, "PrimitiveParser parses string '42' as number 42");

const boolVal = PrimitiveParser.parse("true", "boolean");
assert(boolVal === true, "PrimitiveParser parses 'true' as boolean true");

// 2. ArrayParser Tests
const arrVal = ArrayParser.parse("[2, 7, 11, 15]");
assert(Array.isArray(arrVal) && arrVal.length === 4 && arrVal[1] === 7, "ArrayParser parses JSON array string correctly");

// 3. MatrixParser Tests
const matVal = MatrixParser.parse("[[1, 2], [3, 4]]");
assert(Array.isArray(matVal) && matVal[1][0] === 3, "MatrixParser parses 2D matrix correctly");

// 4. LinkedListParser Tests
const listHead = LinkedListParser.parse([1, 2, 3]);
assert(listHead && listHead.val === 1 && listHead.next.val === 2 && listHead.next.next.val === 3, "LinkedListParser builds linked list 1->2->3");

// 5. BinaryTreeParser Tests
const treeRoot = BinaryTreeParser.parse([1, null, 2, 3]);
assert(treeRoot && treeRoot.val === 1 && treeRoot.left === null && treeRoot.right.val === 2 && treeRoot.right.left.val === 3, "BinaryTreeParser builds level-order tree root(1) -> right(2) -> left(3)");

// 6. GraphParser Tests
const graphHead = GraphParser.parse([[2, 4], [1, 3], [2, 4], [1, 3]]);
assert(graphHead && graphHead.val === 1 && graphHead.neighbors.length === 2 && graphHead.neighbors[0].val === 2, "GraphParser connects adjacency list graph nodes");

// 7. Registry Dispatcher Test
const registryResult = InputParserRegistry.parseInput("LinkedListParser", [10, 20]);
assert(registryResult && registryResult.val === 10 && registryResult.next.val === 20, "InputParserRegistry dispatches LinkedListParser correctly");

console.log(`\nInputParserRegistry Test Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
