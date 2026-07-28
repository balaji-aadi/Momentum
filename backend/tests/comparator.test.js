import { ComparatorRegistry } from "../services/judge/comparators/ComparatorRegistry.js";
import { ExactMatch } from "../services/judge/comparators/ExactMatch.js";
import { OrderedArrayMatch } from "../services/judge/comparators/OrderedArrayMatch.js";
import { UnorderedArrayMatch } from "../services/judge/comparators/UnorderedArrayMatch.js";
import { LinkedListMatch } from "../services/judge/comparators/LinkedListMatch.js";
import { TreeMatch } from "../services/judge/comparators/TreeMatch.js";
import { FloatToleranceMatch } from "../services/judge/comparators/FloatToleranceMatch.js";
import { ListNode, TreeNode } from "../services/judge/inputParsers/nodes.js";

console.log("=== Running Universal Execution Engine ComparatorRegistry Unit Tests ===");

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

// 1. ExactMatch Test
const resExact = ExactMatch.compare(42, 42);
assert(resExact.match === true, "ExactMatch matches 42 === 42");

// 2. OrderedArrayMatch Test
const resOrdered = OrderedArrayMatch.compare([0, 1], [0, 1]);
assert(resOrdered.match === true, "OrderedArrayMatch matches [0,1] === [0,1]");

const resOrderedFail = OrderedArrayMatch.compare([0, 1], [1, 0]);
assert(resOrderedFail.match === false, "OrderedArrayMatch rejects mismatched order [0,1] vs [1,0]");

// 3. UnorderedArrayMatch Test (Two Sum index pair case)
const resUnordered = UnorderedArrayMatch.compare([0, 1], [1, 0]);
assert(resUnordered.match === true, "UnorderedArrayMatch matches Two Sum pair [0,1] === [1,0]");

// 4. LinkedListMatch Test
const list1 = new ListNode(1, new ListNode(2, new ListNode(3)));
const list2 = new ListNode(1, new ListNode(2, new ListNode(3)));
const resList = LinkedListMatch.compare(list1, list2);
assert(resList.match === true, "LinkedListMatch matches ListNode 1->2->3");

// 5. TreeMatch Test
const tree1 = new TreeNode(1, null, new TreeNode(2, new TreeNode(3), null));
const tree2 = new TreeNode(1, null, new TreeNode(2, new TreeNode(3), null));
const resTree = TreeMatch.compare(tree1, tree2);
assert(resTree.match === true, "TreeMatch matches BFS level-order binary trees");

// 6. FloatToleranceMatch Test
const resFloat = FloatToleranceMatch.compare(3.1415926, 3.1415900);
assert(resFloat.match === true, "FloatToleranceMatch matches float difference within 1e-5 epsilon");

// 7. Registry Dispatcher Test
const resRegistry = ComparatorRegistry.compareOutput("UnorderedArrayMatch", [2, 1], [1, 2]);
assert(resRegistry.match === true, "ComparatorRegistry dispatches UnorderedArrayMatch correctly");

console.log(`\nComparatorRegistry Test Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
