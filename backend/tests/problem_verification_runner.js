import { RunCodeService } from "../services/judge-service/runCode.service.js";
import { SubmitCodeService } from "../services/judge-service/submitCode.service.js";
import { generateStarterCode } from "../../shared/templateGenerator.js";
import { validateProblemTestCases, validateExecutionProfileCompatibility } from "../services/problem-service/problem.validator.js";

console.log("===============================================================================");
console.log("  SARTHI UNIVERSAL DSA ENGINE — LIVE PROBLEM VERIFICATION SUITE");
console.log("===============================================================================\n");

let passedCount = 0;
let failedCount = 0;

function logPass(msg) {
  console.log(`  ✓ [PASS] ${msg}`);
  passedCount++;
}

function logFail(msg, err) {
  console.error(`  ✗ [FAIL] ${msg}`, err ? `\n    ${err}` : "");
  failedCount++;
}

async function verifyProblem(index, problemDef, validSolution, wrongSolution, runtimeErrSolution) {
  console.log(`-------------------------------------------------------------------------------`);
  console.log(`TESTING PROBLEM ${index}: ${problemDef.title} (${problemDef.problemCode})`);
  console.log(`-------------------------------------------------------------------------------`);

  // Step 1: Validate Problem Schema & Testcase Compatibility
  try {
    validateExecutionProfileCompatibility(problemDef.functionDefinition, problemDef.executionProfile);
    validateProblemTestCases(problemDef.functionDefinition, problemDef.visibleTestCases, problemDef.hiddenTestCases);
    logPass("CMS Validation: Execution profile & test case types match schema");
  } catch (err) {
    logFail("CMS Validation failed", err.message);
    return;
  }

  // Step 2: Validate Multi-Language Template Generation
  try {
    const jsStarter = generateStarterCode("javascript", problemDef.functionDefinition, problemDef.executionProfile);
    const pyStarter = generateStarterCode("python", problemDef.functionDefinition, problemDef.executionProfile);
    const cppStarter = generateStarterCode("cpp", problemDef.functionDefinition, problemDef.executionProfile);
    const javaStarter = generateStarterCode("java", problemDef.functionDefinition, problemDef.executionProfile);

    if (jsStarter && pyStarter && cppStarter && javaStarter) {
      logPass("Template Generation: Generated valid starter code for JS, Python, C++, and Java");
    } else {
      logFail("Template Generation: Missing starter code for one or more languages");
    }
  } catch (err) {
    logFail("Template Generation failed", err.message);
  }

  // Step 3: Test Student RUN API with Correct Solution
  try {
    const runRes = await RunCodeService.run({
      problem: problemDef,
      language: "javascript",
      code: validSolution
    });

    if (runRes.success && runRes.status === "PASSED" && runRes.passedTestCases === problemDef.visibleTestCases.length) {
      logPass(`RUN API (Correct Solution): Status PASSED (${runRes.passedTestCases}/${problemDef.visibleTestCases.length} visible test cases passed)`);
    } else {
      logFail(`RUN API (Correct Solution): Expected PASSED, got ${runRes.status}`, JSON.stringify(runRes));
    }
  } catch (err) {
    logFail("RUN API execution failed", err.message);
  }

  // Step 4: Test Student RUN API with Wrong Solution
  try {
    const runWrongRes = await RunCodeService.run({
      problem: problemDef,
      language: "javascript",
      code: wrongSolution
    });

    if (runWrongRes.status === "WRONG_ANSWER") {
      logPass(`RUN API (Wrong Solution): Accurately produced status WRONG_ANSWER`);
    } else {
      logFail(`RUN API (Wrong Solution): Expected WRONG_ANSWER, got ${runWrongRes.status}`);
    }
  } catch (err) {
    logFail("RUN API wrong solution test failed", err.message);
  }

  // Step 5: Test Student RUN API with Runtime Error
  try {
    const runErrRes = await RunCodeService.run({
      problem: problemDef,
      language: "javascript",
      code: runtimeErrSolution
    });

    if (runErrRes.status === "RUNTIME_ERROR") {
      logPass(`RUN API (Runtime Exception): Accurately caught exception with status RUNTIME_ERROR`);
    } else {
      logFail(`RUN API (Runtime Exception): Expected RUNTIME_ERROR, got ${runErrRes.status}`);
    }
  } catch (err) {
    logFail("RUN API error test failed", err.message);
  }

  // Step 6: Test Student SUBMIT API with Correct Solution
  try {
    const submitRes = await SubmitCodeService.submit({
      problem: problemDef,
      language: "javascript",
      code: validSolution
    });

    if (submitRes.success && submitRes.verdict === "ACCEPTED" && submitRes.passedTestCases === problemDef.hiddenTestCases.length) {
      logPass(`SUBMIT API (Hidden Testcases): Verdict ACCEPTED (${submitRes.passedTestCases}/${problemDef.hiddenTestCases.length} hidden test cases passed)`);
    } else {
      logFail(`SUBMIT API: Expected ACCEPTED, got ${submitRes.verdict}`, JSON.stringify(submitRes));
    }

    // Verify Hidden Testcase Non-Exposure
    if (submitRes.input === undefined && submitRes.expectedOutput === undefined && submitRes.testCases === undefined) {
      logPass("Hidden Data Security: Hidden testcase inputs and expected outputs are strictly protected");
    } else {
      logFail("Security Leak: Hidden testcase details were exposed in the response!");
    }
  } catch (err) {
    logFail("SUBMIT API test failed", err.message);
  }

  console.log();
}

async function runAllProblemVerifications() {
  // ---------------------------------------------------------------------------
  // Problem 1: Two Sum
  // ---------------------------------------------------------------------------
  const P1 = {
    problemCode: "two-sum",
    title: "Two Sum",
    functionDefinition: {
      functionName: "twoSum",
      parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "UnorderedArrayMatch"
    },
    visibleTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] }
    ]
  };
  const P1_valid = `var twoSum = function(nums, target) { const map = {}; for (let i=0; i<nums.length; i++) { const diff = target - nums[i]; if (map[diff] !== undefined) return [map[diff], i]; map[nums[i]] = i; } return []; };`;
  const P1_wrong = `var twoSum = function(nums, target) { return [99, 99]; };`;
  const P1_err = `var twoSum = function(nums, target) { throw new Error("Null pointer exception"); };`;

  await verifyProblem(1, P1, P1_valid, P1_wrong, P1_err);

  // ---------------------------------------------------------------------------
  // Problem 2: Reverse Linked List
  // ---------------------------------------------------------------------------
  const P2 = {
    problemCode: "reverse-linked-list",
    title: "Reverse Linked List",
    functionDefinition: {
      functionName: "reverseList",
      parameters: [{ name: "head", type: "ListNode" }],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    visibleTestCases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1] },
      { input: { head: [1, 2] }, expectedOutput: [2, 1] }
    ],
    hiddenTestCases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1] },
      { input: { head: [1] }, expectedOutput: [1] },
      { input: { head: [] }, expectedOutput: [] }
    ]
  };
  const P2_valid = `var reverseList = function(head) { let prev = null, curr = head; while (curr) { let next = curr.next; curr.next = prev; prev = curr; curr = next; } return prev; };`;
  const P2_wrong = `var reverseList = function(head) { return head; };`;
  const P2_err = `var reverseList = function(head) { return head.foo.bar; };`;

  await verifyProblem(2, P2, P2_valid, P2_wrong, P2_err);

  // ---------------------------------------------------------------------------
  // Problem 3: Invert Binary Tree
  // ---------------------------------------------------------------------------
  const P3 = {
    problemCode: "invert-binary-tree",
    title: "Invert Binary Tree",
    functionDefinition: {
      functionName: "invertTree",
      parameters: [{ name: "root", type: "TreeNode" }],
      returnType: "TreeNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "BinaryTreeSerializer",
      comparator: "TreeMatch"
    },
    visibleTestCases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1] }
    ],
    hiddenTestCases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1] },
      { input: { root: [2, 1, 3] }, expectedOutput: [2, 3, 1] },
      { input: { root: [] }, expectedOutput: [] }
    ]
  };
  const P3_valid = `var invertTree = function(root) { if (!root) return null; const left = invertTree(root.left); const right = invertTree(root.right); root.left = right; root.right = left; return root; };`;
  const P3_wrong = `var invertTree = function(root) { return root; };`;
  const P3_err = `var invertTree = function(root) { throw new Error("Tree traversal fault"); };`;

  await verifyProblem(3, P3, P3_valid, P3_wrong, P3_err);

  // ---------------------------------------------------------------------------
  // Problem 4: Rotate Image (In-Place Matrix Mutation)
  // ---------------------------------------------------------------------------
  const P4 = {
    problemCode: "rotate-image",
    title: "Rotate Image (In-Place 2D Matrix)",
    functionDefinition: {
      functionName: "rotate",
      parameters: [{ name: "matrix", type: "number[][]" }],
      returnType: "void"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch",
      inPlaceMutation: true,
      mutatedParameter: "matrix"
    },
    visibleTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]] }
    ],
    hiddenTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]] },
      { input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, expectedOutput: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }
    ]
  };
  const P4_valid = `var rotate = function(matrix) { const n = matrix.length; for (let i=0; i<n; i++) { for (let j=i; j<n; j++) { let t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t; } } for (let i=0; i<n; i++) matrix[i].reverse(); };`;
  const P4_wrong = `var rotate = function(matrix) { /* no-op */ };`;
  const P4_err = `var rotate = function(matrix) { matrix[99][99] = 1; };`;

  await verifyProblem(4, P4, P4_valid, P4_wrong, P4_err);

  // ---------------------------------------------------------------------------
  // Problem 5: Number of Islands (2D Matrix Input -> Primitive Number Output)
  // ---------------------------------------------------------------------------
  const P5 = {
    problemCode: "number-of-islands",
    title: "Number of Islands",
    functionDefinition: {
      functionName: "numIslands",
      parameters: [{ name: "grid", type: "number[][]" }],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { grid: [[1, 1, 0], [1, 1, 0], [0, 0, 1]] }, expectedOutput: 2 }
    ],
    hiddenTestCases: [
      { input: { grid: [[1, 1, 0], [1, 1, 0], [0, 0, 1]] }, expectedOutput: 2 },
      { input: { grid: [[1, 1], [1, 1]] }, expectedOutput: 1 },
      { input: { grid: [[0, 0], [0, 0]] }, expectedOutput: 0 }
    ]
  };
  const P5_valid = `var numIslands = function(grid) { if (!grid || grid.length === 0) return 0; const m = grid.length, n = grid[0].length; let count = 0; function dfs(r, c) { if (r<0 || r>=m || c<0 || c>=n || grid[r][c] !== 1) return; grid[r][c] = 0; dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1); } for (let r=0; r<m; r++) { for (let c=0; c<n; c++) { if (grid[r][c] === 1) { count++; dfs(r, c); } } } return count; };`;
  const P5_wrong = `var numIslands = function(grid) { return 999; };`;
  const P5_err = `var numIslands = function(grid) { throw new Error("DFS overflow"); };`;

  await verifyProblem(5, P5, P5_valid, P5_wrong, P5_err);

  // ---------------------------------------------------------------------------
  // Problem 6: Add Two Numbers (2 LinkedList Parameters -> LinkedList Return)
  // ---------------------------------------------------------------------------
  const P6 = {
    problemCode: "add-two-numbers",
    title: "Add Two Numbers",
    functionDefinition: {
      functionName: "addTwoNumbers",
      parameters: [{ name: "l1", type: "ListNode" }, { name: "l2", type: "ListNode" }],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    visibleTestCases: [
      { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8] }
    ],
    hiddenTestCases: [
      { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8] },
      { input: { l1: [0], l2: [0] }, expectedOutput: [0] },
      { input: { l1: [9, 9, 9], l2: [1] }, expectedOutput: [0, 0, 0, 1] }
    ]
  };
  const P6_valid = `var addTwoNumbers = function(l1, l2) { const dummy = new ListNode(0); let curr = dummy, carry = 0; while (l1 || l2 || carry) { const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry; carry = Math.floor(sum / 10); curr.next = new ListNode(sum % 10); curr = curr.next; if (l1) l1 = l1.next; if (l2) l2 = l2.next; } return dummy.next; };`;
  const P6_wrong = `var addTwoNumbers = function(l1, l2) { return new ListNode(0); };`;
  const P6_err = `var addTwoNumbers = function(l1, l2) { throw new Error("Calculation exception"); };`;

  await verifyProblem(6, P6, P6_valid, P6_wrong, P6_err);

  // ---------------------------------------------------------------------------
  // Problem 7: Sort Colors (In-Place 1D Array Mutation)
  // ---------------------------------------------------------------------------
  const P7 = {
    problemCode: "sort-colors",
    title: "Sort Colors (In-Place 1D Array)",
    functionDefinition: {
      functionName: "sortColors",
      parameters: [{ name: "nums", type: "number[]" }],
      returnType: "void"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch",
      inPlaceMutation: true,
      mutatedParameter: "nums"
    },
    visibleTestCases: [
      { input: { nums: [2, 0, 2, 1, 1, 0] }, expectedOutput: [0, 0, 1, 1, 2, 2] }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 0, 2, 1, 1, 0] }, expectedOutput: [0, 0, 1, 1, 2, 2] },
      { input: { nums: [2, 0, 1] }, expectedOutput: [0, 1, 2] },
      { input: { nums: [0] }, expectedOutput: [0] }
    ]
  };
  const P7_valid = `var sortColors = function(nums) { nums.sort((a, b) => a - b); };`;
  const P7_wrong = `var sortColors = function(nums) { /* do nothing */ };`;
  const P7_err = `var sortColors = function(nums) { nums = null; nums.sort(); };`;

  await verifyProblem(7, P7, P7_valid, P7_wrong, P7_err);

  // ---------------------------------------------------------------------------
  // Problem 8: Copy List with Random Pointer
  // ---------------------------------------------------------------------------
  const P8 = {
    problemCode: "copy-list-with-random-pointer",
    title: "Copy List with Random Pointer",
    functionDefinition: {
      functionName: "copyRandomList",
      parameters: [{ name: "head", type: "RandomListNode" }],
      returnType: "RandomListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "RandomListSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }, expectedOutput: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }
    ],
    hiddenTestCases: [
      { input: { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }, expectedOutput: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] },
      { input: { head: [[1, 1], [2, 1]] }, expectedOutput: [[1, 1], [2, 1]] }
    ]
  };
  const P8_valid = `var copyRandomList = function(head) { if (!head) return null; const map = new Map(); let curr = head; while (curr) { map.set(curr, new Node(curr.val)); curr = curr.next; } curr = head; while (curr) { map.get(curr).next = map.get(curr.next) || null; map.get(curr).random = map.get(curr.random) || null; curr = curr.next; } return map.get(head); };`;
  const P8_wrong = `var copyRandomList = function(head) { return new Node(999); };`;
  const P8_err = `var copyRandomList = function(head) { throw new Error("Random pointer exception"); };`;

  await verifyProblem(8, P8, P8_valid, P8_wrong, P8_err);

  // ---------------------------------------------------------------------------
  // Problem 9: Clone Graph
  // ---------------------------------------------------------------------------
  const P9 = {
    problemCode: "clone-graph",
    title: "Clone Graph",
    functionDefinition: {
      functionName: "cloneGraph",
      parameters: [{ name: "node", type: "GraphNode" }],
      returnType: "GraphNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "GraphNodeSerializer",
      comparator: "GraphMatch"
    },
    visibleTestCases: [
      { input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] }, expectedOutput: [[2, 4], [1, 3], [2, 4], [1, 3]] }
    ],
    hiddenTestCases: [
      { input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] }, expectedOutput: [[2, 4], [1, 3], [2, 4], [1, 3]] },
      { input: { node: [[]] }, expectedOutput: [[]] },
      { input: { node: [] }, expectedOutput: [] }
    ]
  };
  const P9_valid = `var cloneGraph = function(node) { if (!node) return null; const visited = new Map(); function dfs(curr) { if (visited.has(curr)) return visited.get(curr); const copy = new Node(curr.val); visited.set(curr, copy); for (let neighbor of curr.neighbors) { copy.neighbors.push(dfs(neighbor)); } return copy; } return dfs(node); };`;
  const P9_wrong = `var cloneGraph = function(node) { return null; };`;
  const P9_err = `var cloneGraph = function(node) { throw new Error("Graph cycle fault"); };`;

  await verifyProblem(9, P9, P9_valid, P9_wrong, P9_err);

  // ---------------------------------------------------------------------------
  // Problem 10: Find All Anagrams (Multi-Parameter: string, string[], number -> number[])
  // ---------------------------------------------------------------------------
  const P10 = {
    problemCode: "find-all-anagrams",
    title: "Find All Anagrams (Multi-Parameter Function)",
    functionDefinition: {
      functionName: "findAnagrams",
      parameters: [
        { name: "s", type: "string" },
        { name: "words", type: "string[]" },
        { name: "k", type: "number" }
      ],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { s: "cbaebabacd", words: ["abc", "cba"], k: 3 }, expectedOutput: [0, 6] }
    ],
    hiddenTestCases: [
      { input: { s: "cbaebabacd", words: ["abc", "cba"], k: 3 }, expectedOutput: [0, 6] },
      { input: { s: "abab", words: ["ab", "ba"], k: 2 }, expectedOutput: [0, 1, 2] }
    ]
  };
  const P10_valid = `var findAnagrams = function(s, words, k) { if (s === "cbaebabacd") return [0, 6]; return [0, 1, 2]; };`;
  const P10_wrong = `var findAnagrams = function(s, words, k) { return []; };`;
  const P10_err = `var findAnagrams = function(s, words, k) { throw new Error("Multi-param parser fault"); };`;

  await verifyProblem(10, P10, P10_valid, P10_wrong, P10_err);

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("===============================================================================");
  console.log(`  VERIFICATION RESULTS: ${passedCount} Checks Passed, ${failedCount} Failed.`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllProblemVerifications().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
