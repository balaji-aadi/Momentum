import { OutputSerializerRegistry } from "../services/judge/outputSerializers/OutputSerializerRegistry.js";
import { PrimitiveSerializer } from "../services/judge/outputSerializers/PrimitiveSerializer.js";
import { ArraySerializer } from "../services/judge/outputSerializers/ArraySerializer.js";
import { LinkedListSerializer } from "../services/judge/outputSerializers/LinkedListSerializer.js";
import { BinaryTreeSerializer } from "../services/judge/outputSerializers/BinaryTreeSerializer.js";
import { ListNode, TreeNode } from "../services/judge/inputParsers/nodes.js";

console.log("=== Running Universal Execution Engine OutputSerializerRegistry Unit Tests ===");

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

// 1. PrimitiveSerializer Tests
const primVal = PrimitiveSerializer.serialize(42);
assert(primVal === 42, "PrimitiveSerializer serializes number 42 correctly");

// 2. ArraySerializer Tests
const arrVal = ArraySerializer.serialize([0, 1]);
assert(Array.isArray(arrVal) && arrVal[0] === 0 && arrVal[1] === 1, "ArraySerializer serializes array [0,1]");

// 3. LinkedListSerializer Tests
const head = new ListNode(1, new ListNode(2, new ListNode(3)));
const serializedList = LinkedListSerializer.serialize(head);
assert(Array.isArray(serializedList) && JSON.stringify(serializedList) === "[1,2,3]", "LinkedListSerializer converts ListNode chain back to [1,2,3]");

// 4. BinaryTreeSerializer Tests
const tree = new TreeNode(1, null, new TreeNode(2, new TreeNode(3), null));
const serializedTree = BinaryTreeSerializer.serialize(tree);
assert(Array.isArray(serializedTree) && JSON.stringify(serializedTree) === "[1,null,2,3]", "BinaryTreeSerializer converts TreeNode hierarchy back to level-order [1,null,2,3]");

// 5. OutputSerializerRegistry Dispatcher Test
const dispatchedList = OutputSerializerRegistry.serializeOutput("LinkedListSerializer", head);
assert(JSON.stringify(dispatchedList) === "[1,2,3]", "OutputSerializerRegistry dispatches LinkedListSerializer correctly");

console.log(`\nOutputSerializerRegistry Test Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
