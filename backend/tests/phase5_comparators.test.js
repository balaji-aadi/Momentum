import {
  ComparatorRegistry,
  ExactMatch,
  OrderedArrayMatch,
  UnorderedArrayMatch,
  LinkedListMatch,
  TreeMatch,
  GraphMatch,
  FloatToleranceMatch,
  normalizeExpectedOutput,
  UnsupportedComparatorError
} from "../services/judge/comparators/ComparatorRegistry.js";

console.log("===============================================================================");
console.log("  PHASE 5: COMPARATOR REGISTRY AUTOMATED TEST SUITE");
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
// 1. Exact Primitive Matching
// -----------------------------------------------------------------------------
console.log("[1. Exact Primitive Matching]");
const r1 = ExactMatch.compare(42, 42);
assert(r1.passed === true && r1.code === "MATCH", "1. ExactMatch numbers 42 === 42");

const r2 = ExactMatch.compare("hello", "hello");
assert(r2.passed === true && r2.code === "MATCH", "1. ExactMatch strings");

const r3 = ExactMatch.compare(true, true);
assert(r3.passed === true && r3.code === "MATCH", "1. ExactMatch booleans");

const r4 = ExactMatch.compare(null, null);
assert(r4.passed === true && r4.code === "MATCH", "1. ExactMatch null === null");

// -----------------------------------------------------------------------------
// 2. Exact Array / Matrix Matching
// -----------------------------------------------------------------------------
console.log("\n[2. Exact Array / Matrix Matching]");
const rMat = ExactMatch.compare([[1, 2], [3, 4]], [[1, 2], [3, 4]]);
assert(rMat.passed === true && rMat.code === "MATCH", "2. ExactMatch 2D matrix");

// -----------------------------------------------------------------------------
// 3. Ordered Array Matching & Mismatches
// -----------------------------------------------------------------------------
console.log("\n[3. Ordered Array Matching]");
const rOrdPass = OrderedArrayMatch.compare([0, 1, 2], [0, 1, 2]);
assert(rOrdPass.passed === true && rOrdPass.code === "MATCH", "3. OrderedArrayMatch exact order");

const rOrdFailOrder = OrderedArrayMatch.compare([0, 1], [1, 0]);
assert(rOrdFailOrder.passed === false && rOrdFailOrder.code === "ELEMENT_MISMATCH", "3. OrderedArrayMatch rejects mismatched order with ELEMENT_MISMATCH");

const rOrdFailLen = OrderedArrayMatch.compare([0, 1], [0, 1, 2]);
assert(rOrdFailLen.passed === false && rOrdFailLen.code === "LENGTH_MISMATCH", "3. OrderedArrayMatch rejects mismatched length with LENGTH_MISMATCH");

// -----------------------------------------------------------------------------
// 4 & 5 & 6. Unordered Array Matching with Depth & Multiset Frequency
// -----------------------------------------------------------------------------
console.log("\n[4, 5, 6. Unordered Array Matching]");
const rUnordPass = UnorderedArrayMatch.compare([0, 1], [1, 0]);
assert(rUnordPass.passed === true && rUnordPass.code === "MATCH", "4. UnorderedArrayMatch matches [0,1] === [1,0]");

// Multiset Duplicate Sensitivity
const rUnordDupFail = UnorderedArrayMatch.compare([1, 1, 2], [1, 2]);
assert(rUnordDupFail.passed === false && rUnordDupFail.code === "LENGTH_MISMATCH", "5. UnorderedArrayMatch rejects [1,1,2] vs [1,2]");

const rUnordFreqFail = UnorderedArrayMatch.compare([1, 1, 2], [1, 2, 2]);
assert(rUnordFreqFail.passed === false && rUnordFreqFail.code === "FREQUENCY_MISMATCH", "5. UnorderedArrayMatch rejects frequency mismatch [1,1,2] vs [1,2,2] with FREQUENCY_MISMATCH");

// Nested Unordered Outer with Ordered Inner (depth: 1)
const rNestedPass = UnorderedArrayMatch.compare([[1, 2], [3, 4]], [[3, 4], [1, 2]], { depth: 1 });
assert(rNestedPass.passed === true && rNestedPass.code === "MATCH", "6. UnorderedArrayMatch depth: 1 matches outer unordered rows");

const rNestedFailInner = UnorderedArrayMatch.compare([[1, 2], [3, 4]], [[2, 1], [3, 4]], { depth: 1 });
assert(rNestedFailInner.passed === false && rNestedFailInner.code === "FREQUENCY_MISMATCH", "6. UnorderedArrayMatch depth: 1 rejects inner row reordering [2,1] vs [1,2]");

// -----------------------------------------------------------------------------
// 7. Linked List Matching
// -----------------------------------------------------------------------------
console.log("\n[7. Linked List Matching]");
const rListPass = LinkedListMatch.compare([1, 2, 3], [1, 2, 3]);
assert(rListPass.passed === true && rListPass.code === "MATCH", "7. LinkedListMatch matches [1,2,3]");

const rListFailVal = LinkedListMatch.compare([1, 9, 3], [1, 2, 3]);
assert(rListFailVal.passed === false && rListFailVal.code === "ELEMENT_MISMATCH", "7. LinkedListMatch detects node value mismatch with ELEMENT_MISMATCH");

// -----------------------------------------------------------------------------
// 8. Tree Structural Matching
// -----------------------------------------------------------------------------
console.log("\n[8. Tree Matching]");
const rTreePass = TreeMatch.compare([1, null, 2, 3], [1, null, 2, 3]);
assert(rTreePass.passed === true && rTreePass.code === "MATCH", "8. TreeMatch matches [1,null,2,3]");

const rTreeFailStruct = TreeMatch.compare([1, 2, null, 3], [1, null, 2, 3]);
assert(rTreeFailStruct.passed === false && rTreeFailStruct.code === "STRUCTURE_MISMATCH", "8. TreeMatch detects structural null mismatch with STRUCTURE_MISMATCH");

// -----------------------------------------------------------------------------
// 9, 10, 11. Graph Matching (Labeled Equivalence)
// -----------------------------------------------------------------------------
console.log("\n[9, 10, 11. Graph Matching]");
const rGraphPass = GraphMatch.compare([[2, 4], [1, 3], [2, 4], [1, 3]], [[2, 4], [1, 3], [2, 4], [1, 3]]);
assert(rGraphPass.passed === true && rGraphPass.code === "MATCH", "9. GraphMatch matches standard 1..V graph");

// Arbitrary Labeled Graph Matching
const arbG1 = [{ val: 10, neighbors: [20, 50] }, { val: 20, neighbors: [10] }, { val: 50, neighbors: [10] }];
const arbG2 = [{ val: 10, neighbors: [50, 20] }, { val: 20, neighbors: [10] }, { val: 50, neighbors: [10] }];
const rArbPass = GraphMatch.compare(arbG1, arbG2);
assert(rArbPass.passed === true && rArbPass.code === "MATCH", "9. GraphMatch matches arbitrary node values (10, 20, 50)");

// Label Mismatch Rejection
const arbGDiffLabels = [{ val: 100, neighbors: [200, 500] }, { val: 200, neighbors: [100] }, { val: 500, neighbors: [100] }];
const rLabelFail = GraphMatch.compare(arbG1, arbGDiffLabels);
assert(rLabelFail.passed === false && rLabelFail.code === "GRAPH_MISMATCH", "10. GraphMatch strictly rejects different node labels (100 vs 10) with GRAPH_MISMATCH");

// Adjacency Mismatch
const arbGDiffAdj = [{ val: 10, neighbors: [20] }, { val: 20, neighbors: [10] }, { val: 50, neighbors: [10] }];
const rAdjFail = GraphMatch.compare(arbG1, arbGDiffAdj);
assert(rAdjFail.passed === false && rAdjFail.code === "GRAPH_MISMATCH", "11. GraphMatch detects adjacency neighbor mismatch with GRAPH_MISMATCH");

// -----------------------------------------------------------------------------
// 12. Float Tolerance Matching
// -----------------------------------------------------------------------------
console.log("\n[12. Float Tolerance Matching]");
const rFloatPass = FloatToleranceMatch.compare(3.1415926, 3.1415900, { absTol: 1e-5 });
assert(rFloatPass.passed === true && rFloatPass.code === "MATCH", "12. FloatToleranceMatch matches within epsilon tolerance");

const rFloatFail = FloatToleranceMatch.compare(3.14159, 3.14000, { absTol: 1e-5 });
assert(rFloatFail.passed === false && rFloatFail.code === "FLOAT_TOLERANCE_EXCEEDED", "12. FloatToleranceMatch rejects difference exceeding tolerance with FLOAT_TOLERANCE_EXCEEDED");

const rFloatNullFail = FloatToleranceMatch.compare(null, 3.14);
assert(rFloatNullFail.passed === false && rFloatNullFail.code === "NULL_MISMATCH", "12. FloatToleranceMatch rejects null float with NULL_MISMATCH");

// -----------------------------------------------------------------------------
// 13 & 14. Type-Aware Expected Output Normalization
// -----------------------------------------------------------------------------
console.log("\n[13, 14. Type-Aware Expected Output Normalization]");
const normStr = normalizeExpectedOutput("42", "string");
assert(normStr === "42" && typeof normStr === "string", "13. Normalization: String returnType preserves '42' as string");

const normNum = normalizeExpectedOutput("42", "number");
assert(normNum === 42 && typeof normNum === "number", "13. Normalization: Number returnType converts '42' to number 42");

const normBoolStr = normalizeExpectedOutput("true", "string");
assert(normBoolStr === "true" && typeof normBoolStr === "string", "13. Normalization: String 'true' preserved as string");

const normBool = normalizeExpectedOutput("true", "boolean");
assert(normBool === true && typeof normBool === "boolean", "13. Normalization: Boolean 'true' converted to true");

// Strict Type Mismatch in Comparator
const rTypeMismatch = ExactMatch.compare("42", 42);
assert(rTypeMismatch.passed === false && rTypeMismatch.code === "TYPE_MISMATCH", "14. Comparator strictly rejects string '42' vs number 42 with TYPE_MISMATCH");

// -----------------------------------------------------------------------------
// 15 & 16. Null Handling & Error Codes
// -----------------------------------------------------------------------------
console.log("\n[15, 16. Null Handling & Machine-Readable Error Codes]");
const rNullVsArr = OrderedArrayMatch.compare(null, [1, 2]);
assert(rNullVsArr.passed === false && rNullVsArr.code === "NULL_MISMATCH", "15. Null vs Array returns NULL_MISMATCH");

// -----------------------------------------------------------------------------
// 17 & 18. Extensibility & Unsupported Error
// -----------------------------------------------------------------------------
console.log("\n[17, 18. Extensibility & Unsupported Comparator Error]");
assertThrows(
  () => ComparatorRegistry.getComparator("NonExistentComparator"),
  "is not registered",
  "18. ComparatorRegistry strictly throws UnsupportedComparatorError (Zero silent fallback)"
);

const dummyCustomComp = {
  compare: (a, b) => ({ passed: true, comparator: "CustomComp", code: "MATCH", reason: "Custom match" })
};
ComparatorRegistry.register("CustomComp", dummyCustomComp);
const rCustom = ComparatorRegistry.compare(1, 1, "CustomComp");
assert(rCustom.passed === true && rCustom.comparator === "CustomComp", "17. ComparatorRegistry registers and invokes custom comparator");

// -----------------------------------------------------------------------------
// 19 & 20. Empty Structures & Negative Values
// -----------------------------------------------------------------------------
console.log("\n[19, 20. Empty Structures & Negative Values]");
const rEmptyArr = OrderedArrayMatch.compare([], []);
assert(rEmptyArr.passed === true && rEmptyArr.code === "MATCH", "19. Empty array [] === []");

const rEmptyStr = ExactMatch.compare("", "");
assert(rEmptyStr.passed === true && rEmptyStr.code === "MATCH", "19. Empty string '' === ''");

const rNeg = ExactMatch.compare(-42, -42);
assert(rNeg.passed === true && rNeg.code === "MATCH", "20. Negative numbers -42 === -42");

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 5 TEST SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
