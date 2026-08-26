import "dotenv/config";
import connectDB from "../config/db.config.js";
import Problem from "../models/problem.model.js";
import Topic from "../models/topic.model.js";
import Company from "../models/company.model.js";
import Pattern from "../models/pattern.model.js";
import { generateStarterCode } from "../../shared/templateGenerator.js";
import mongoose from "mongoose";

const DEFAULT_TOPICS = [
  { name: "Array", category: "Data Structures", slug: "array" },
  { name: "String", category: "Data Structures", slug: "string" },
  { name: "Hash Table", category: "Data Structures", slug: "hash-table" },
  { name: "Two Pointers", category: "Algorithms", slug: "two-pointers" },
  { name: "Sliding Window", category: "Algorithms", slug: "sliding-window" },
  { name: "Linked List", category: "Data Structures", slug: "linked-list" },
  { name: "Binary Tree", category: "Data Structures", slug: "binary-tree" },
  { name: "Graph", category: "Data Structures", slug: "graph" },
  { name: "Depth-First Search (DFS)", category: "Algorithms", slug: "dfs" },
  { name: "Breadth-First Search (BFS)", category: "Algorithms", slug: "bfs" },
  { name: "Matrix", category: "Data Structures", slug: "matrix" },
  { name: "Sorting", category: "Algorithms", slug: "sorting" }
];

const DEFAULT_COMPANIES = [
  { name: "Google", slug: "google", logoUrl: "https://logo.clearbit.com/google.com" },
  { name: "Meta", slug: "meta", logoUrl: "https://logo.clearbit.com/meta.com" },
  { name: "Amazon", slug: "amazon", logoUrl: "https://logo.clearbit.com/amazon.com" },
  { name: "Microsoft", slug: "microsoft", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { name: "Apple", slug: "apple", logoUrl: "https://logo.clearbit.com/apple.com" }
];

const DEFAULT_PATTERNS = [
  { name: "Two Pointers", slug: "two-pointers", description: "Use two pointers moving in opposite or same direction." },
  { name: "Sliding Window", slug: "sliding-window", description: "Maintain a running window range over arrays/strings." },
  { name: "DFS / BFS Traversal", slug: "dfs-bfs", description: "Recursive or iterative graph/tree exploration." }
];

const PROBLEMS_DATA = [
  {
    problemCode: "DSA-001",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    status: "Published",
    topics: ["Array", "Hash Table"],
    companies: ["Google", "Meta", "Amazon"],
    pattern: "Two Pointers",
    descriptionMarkdown: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].", order: 1 },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].", order: 2 },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].", order: 3 }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    hints: [
      "A really brute force way would be to search for all possible pairs of numbers but that would be slow.",
      "Can you use a hash map to store seen elements and their indices for O(1) lookup?"
    ],
    functionDefinition: {
      functionName: "twoSum",
      parameters: [
        { name: "nums", type: "number[]", required: true },
        { name: "target", type: "number", required: true }
      ],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "UnorderedArrayMatch"
    },
    visibleTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], order: 1 },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], order: 2 }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], executionOrder: 1 },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], executionOrder: 2 },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1], executionOrder: 3 },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expectedOutput: [2, 4], executionOrder: 4 }
    ]
  },
  {
    problemCode: "DSA-002",
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    difficulty: "Easy",
    status: "Published",
    topics: ["Linked List"],
    companies: ["Amazon", "Microsoft", "Apple"],
    descriptionMarkdown: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "The linked list is reversed.", order: 1 },
      { input: "head = [1,2]", output: "[2,1]", explanation: "Two elements reversed.", order: 2 },
      { input: "head = []", output: "[]", explanation: "Empty list returns empty list.", order: 3 }
    ],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    hints: [
      "Think about maintaining three pointers: prev, curr, and next.",
      "Iteratively reverse the next pointer of each node."
    ],
    functionDefinition: {
      functionName: "reverseList",
      parameters: [
        { name: "head", type: "ListNode", required: true }
      ],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    visibleTestCases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1], order: 1 },
      { input: { head: [1, 2] }, expectedOutput: [2, 1], order: 2 }
    ],
    hiddenTestCases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1], executionOrder: 1 },
      { input: { head: [1] }, expectedOutput: [1], executionOrder: 2 },
      { input: { head: [] }, expectedOutput: [], executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-003",
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    difficulty: "Easy",
    status: "Published",
    topics: ["Binary Tree", "Depth-First Search (DFS)", "Breadth-First Search (BFS)"],
    companies: ["Google", "Meta"],
    pattern: "DFS / BFS Traversal",
    descriptionMarkdown: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.\n\nInverting a tree means swapping every left child with its corresponding right child.`,
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]", explanation: "Every subtree left and right children are swapped.", order: 1 },
      { input: "root = [2,1,3]", output: "[2,3,1]", explanation: "Subtree inverted.", order: 2 }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    hints: [
      "Since each node in the tree is visited only once, the time complexity is O(n).",
      "Recursively invert the left subtree and right subtree, then swap."
    ],
    functionDefinition: {
      functionName: "invertTree",
      parameters: [
        { name: "root", type: "TreeNode", required: true }
      ],
      returnType: "TreeNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "BinaryTreeSerializer",
      comparator: "TreeMatch"
    },
    visibleTestCases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1], order: 1 }
    ],
    hiddenTestCases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1], executionOrder: 1 },
      { input: { root: [2, 1, 3] }, expectedOutput: [2, 3, 1], executionOrder: 2 },
      { input: { root: [] }, expectedOutput: [], executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-004",
    title: "Rotate Image",
    slug: "rotate-image",
    difficulty: "Medium",
    status: "Published",
    topics: ["Array", "Matrix"],
    companies: ["Amazon", "Microsoft"],
    descriptionMarkdown: `You are given an \`n x n\` 2D \`matrix\` representing an image, rotate the image by **90 degrees (clockwise)** in-place.\n\nYou have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.`,
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]", explanation: "Rotate matrix 90 degrees clockwise.", order: 1 },
      { input: "matrix = [[1,2],[3,4]]", output: "[[3,1],[4,2]]", explanation: "Rotate 2x2 matrix 90 degrees clockwise.", order: 2 }
    ],
    constraints: [
      "n == matrix.length == matrix[i].length",
      "1 <= n <= 20",
      "-1000 <= matrix[i][j] <= 1000"
    ],
    hints: [
      "Transpose the matrix (swap matrix[i][j] with matrix[j][i]).",
      "Then reverse each row."
    ],
    functionDefinition: {
      functionName: "rotate",
      parameters: [
        { name: "matrix", type: "number[][]", required: true }
      ],
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
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]], order: 1 }
    ],
    hiddenTestCases: [
      { input: { matrix: [[1, 2], [3, 4]] }, expectedOutput: [[3, 1], [4, 2]], executionOrder: 1 },
      { input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, expectedOutput: [[7, 4, 1], [8, 5, 2], [9, 6, 3]], executionOrder: 2 }
    ]
  },
  {
    problemCode: "DSA-005",
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "Medium",
    status: "Published",
    topics: ["Matrix", "Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Graph"],
    companies: ["Amazon", "Google", "Meta"],
    pattern: "DFS / BFS Traversal",
    descriptionMarkdown: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`1\`s (land) and \`0\`s (water), return *the number of islands*.\n\nAn **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      { input: "grid = [[1,1,0],[1,1,0],[0,0,1]]", output: "2", explanation: "There are two isolated connected components.", order: 1 }
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is 0 or 1."
    ],
    hints: [
      "Iterate through each cell. When you find a 1, increment count and run DFS/BFS to sink the connected island.",
      "Mark visited cells as 0."
    ],
    functionDefinition: {
      functionName: "numIslands",
      parameters: [
        { name: "grid", type: "number[][]", required: true }
      ],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { grid: [[1, 1, 0], [1, 1, 0], [0, 0, 1]] }, expectedOutput: 2, order: 1 }
    ],
    hiddenTestCases: [
      { input: { grid: [[1, 1, 0], [1, 1, 0], [0, 0, 1]] }, expectedOutput: 2, executionOrder: 1 },
      { input: { grid: [[1, 1], [1, 1]] }, expectedOutput: 1, executionOrder: 2 },
      { input: { grid: [[0, 0], [0, 0]] }, expectedOutput: 0, executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-006",
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Medium",
    status: "Published",
    topics: ["Linked List"],
    companies: ["Amazon", "Microsoft", "Meta"],
    descriptionMarkdown: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    examples: [
      { input: "l1 = [2,4,3], l2 = [5,6,4]", output: "[7,0,8]", explanation: "342 + 465 = 807.", order: 1 }
    ],
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 <= Node.val <= 9",
      "It is guaranteed that the list represents a number that does not have leading zeros."
    ],
    hints: [
      "Maintain a carry variable for sums exceeding 9.",
      "Iterate while l1, l2, or carry exists."
    ],
    functionDefinition: {
      functionName: "addTwoNumbers",
      parameters: [
        { name: "l1", type: "ListNode", required: true },
        { name: "l2", type: "ListNode", required: true }
      ],
      returnType: "ListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "LinkedListSerializer",
      comparator: "LinkedListMatch"
    },
    visibleTestCases: [
      { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8], order: 1 }
    ],
    hiddenTestCases: [
      { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8], executionOrder: 1 },
      { input: { l1: [0], l2: [0] }, expectedOutput: [0], executionOrder: 2 },
      { input: { l1: [9, 9, 9], l2: [1] }, expectedOutput: [0, 0, 0, 1], executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-007",
    title: "Sort Colors",
    slug: "sort-colors",
    difficulty: "Medium",
    status: "Published",
    topics: ["Array", "Two Pointers", "Sorting"],
    companies: ["Microsoft", "Meta"],
    pattern: "Two Pointers",
    descriptionMarkdown: `Given an array \`nums\` with \`n\` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.\n\nWe will use the integers \`0\`, \`1\`, and \`2\` to represent the color red, white, and blue, respectively.\n\nYou must solve this problem without using the library's sort function.`,
    examples: [
      { input: "nums = [2,0,2,1,1,0]", output: "[0,0,1,1,2,2]", explanation: "Array sorted in-place.", order: 1 }
    ],
    constraints: [
      "n == nums.length",
      "1 <= n <= 300",
      "nums[i] is either 0, 1, or 2."
    ],
    hints: [
      "Dutch National Flag algorithm with three pointers: low, mid, high."
    ],
    functionDefinition: {
      functionName: "sortColors",
      parameters: [
        { name: "nums", type: "number[]", required: true }
      ],
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
      { input: { nums: [2, 0, 2, 1, 1, 0] }, expectedOutput: [0, 0, 1, 1, 2, 2], order: 1 }
    ],
    hiddenTestCases: [
      { input: { nums: [2, 0, 2, 1, 1, 0] }, expectedOutput: [0, 0, 1, 1, 2, 2], executionOrder: 1 },
      { input: { nums: [2, 0, 1] }, expectedOutput: [0, 1, 2], executionOrder: 2 },
      { input: { nums: [0] }, expectedOutput: [0], executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-008",
    title: "Copy List with Random Pointer",
    slug: "copy-list-with-random-pointer",
    difficulty: "Medium",
    status: "Published",
    topics: ["Linked List", "Hash Table"],
    companies: ["Amazon", "Meta", "Google"],
    descriptionMarkdown: `A linked list of length \`n\` is given such that each node contains an additional random pointer, which could point to any node in the list, or \`null\`.\n\nConstruct a **deep copy** of the list.`,
    examples: [
      { input: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]", output: "[[7,null],[13,0],[11,4],[10,2],[1,0]]", explanation: "Deep copy constructed with identical values and pointer offsets.", order: 1 }
    ],
    constraints: [
      "0 <= n <= 1000",
      "-10^4 <= Node.val <= 10^4",
      "Node.random is null or is pointing to some node in the linked list."
    ],
    hints: [
      "Use a hash map mapping original nodes to cloned copies."
    ],
    functionDefinition: {
      functionName: "copyRandomList",
      parameters: [
        { name: "head", type: "RandomListNode", required: true }
      ],
      returnType: "RandomListNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "RandomListSerializer",
      comparator: "ExactMatch",
      semanticValidator: "DeepCopyValidator"
    },
    visibleTestCases: [
      { input: { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }, expectedOutput: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]], order: 1 }
    ],
    hiddenTestCases: [
      { input: { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }, expectedOutput: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]], executionOrder: 1 },
      { input: { head: [[1, 1], [2, 1]] }, expectedOutput: [[1, 1], [2, 1]], executionOrder: 2 }
    ]
  },
  {
    problemCode: "DSA-009",
    title: "Clone Graph",
    slug: "clone-graph",
    difficulty: "Medium",
    status: "Published",
    topics: ["Graph", "Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Hash Table"],
    companies: ["Google", "Meta", "Amazon"],
    pattern: "DFS / BFS Traversal",
    descriptionMarkdown: `Given a reference of a node in a **connected** undirected graph.\n\nReturn a **deep copy** (clone) of the graph.\n\nEach node in the graph contains a value (\`int\`) and a list (\`List[Node]\`) of its neighbors.`,
    examples: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]", explanation: "Cloned graph has identical adjacency structure and distinct node objects.", order: 1 }
    ],
    constraints: [
      "The number of nodes in the graph is in the range [0, 100].",
      "1 <= Node.val <= 100",
      "Node.val is unique for each node."
    ],
    hints: [
      "Use a hash map to keep track of already cloned nodes during DFS/BFS to handle cycles."
    ],
    functionDefinition: {
      functionName: "cloneGraph",
      parameters: [
        { name: "node", type: "GraphNode", required: true }
      ],
      returnType: "GraphNode"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "GraphNodeSerializer",
      comparator: "GraphMatch",
      semanticValidator: "DeepCopyValidator"
    },
    visibleTestCases: [
      { input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] }, expectedOutput: [[2, 4], [1, 3], [2, 4], [1, 3]], order: 1 }
    ],
    hiddenTestCases: [
      { input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] }, expectedOutput: [[2, 4], [1, 3], [2, 4], [1, 3]], executionOrder: 1 },
      { input: { node: [[]] }, expectedOutput: [[]], executionOrder: 2 },
      { input: { node: [] }, expectedOutput: [], executionOrder: 3 }
    ]
  },
  {
    problemCode: "DSA-010",
    title: "Find All Anagrams in a String",
    slug: "find-all-anagrams-in-a-string",
    difficulty: "Medium",
    status: "Published",
    topics: ["String", "Sliding Window", "Hash Table"],
    companies: ["Amazon", "Microsoft", "Meta"],
    pattern: "Sliding Window",
    descriptionMarkdown: `Given two strings \`s\` and \`p\`, return *an array of all the start indices of \`p\`'s anagrams in \`s\`*. You may return the answer in **any order**.\n\nAn **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: "s = \"cbaebabacd\", words = [\"abc\", \"cba\"], k = 3", output: "[0,6]", explanation: "The substring with start index = 0 is 'cba', which is an anagram of 'abc'.\nThe substring with start index = 6 is 'bac', which is an anagram of 'abc'.", order: 1 }
    ],
    constraints: [
      "1 <= s.length <= 3 * 10^4",
      "s and p consist of lowercase English letters."
    ],
    hints: [
      "Use frequency counts and a sliding window of length p.length."
    ],
    functionDefinition: {
      functionName: "findAnagrams",
      parameters: [
        { name: "s", type: "string", required: true },
        { name: "words", type: "string[]", required: true },
        { name: "k", type: "number", required: true }
      ],
      returnType: "number[]"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { s: "cbaebabacd", words: ["abc", "cba"], k: 3 }, expectedOutput: [0, 6], order: 1 }
    ],
    hiddenTestCases: [
      { input: { s: "cbaebabacd", words: ["abc", "cba"], k: 3 }, expectedOutput: [0, 6], executionOrder: 1 },
      { input: { s: "abab", words: ["ab", "ba"], k: 2 }, expectedOutput: [0, 1, 2], executionOrder: 2 }
    ]
  },
  {
    problemCode: "DSA-011",
    title: "Factorial",
    slug: "factorial",
    difficulty: "Easy",
    status: "Published",
    topics: ["Recursion"],
    companies: ["Google", "Amazon"],
    pattern: "Recursion",
    descriptionMarkdown: `Given a non-negative integer \`n\`, compute and return its **factorial** (\`n!\`) using **recursion**.

The factorial of a non-negative integer \`n\` is defined as:
- \`0! = 1\`
- \`n! = n * (n - 1)!\` for \`n > 0\`.`,
    examples: [
      { input: "n = 5", output: "120", explanation: "5! = 5 * 4 * 3 * 2 * 1 = 120", order: 1 },
      { input: "n = 0", output: "1", explanation: "0! = 1", order: 2 }
    ],
    constraints: [
      "0 <= n <= 12"
    ],
    hints: [
      "Base case: If n === 0 or n === 1, return 1.",
      "Recursive step: Return n * factorial(n - 1)."
    ],
    functionDefinition: {
      functionName: "factorial",
      parameters: [
        { name: "n", type: "number", required: true }
      ],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { n: 5 }, expectedOutput: 120, order: 1 },
      { input: { n: 0 }, expectedOutput: 1, order: 2 }
    ],
    hiddenTestCases: [
      { input: { n: 1 }, expectedOutput: 1, executionOrder: 1 },
      { input: { n: 3 }, expectedOutput: 6, executionOrder: 2 },
      { input: { n: 7 }, expectedOutput: 5040, executionOrder: 3 },
      { input: { n: 10 }, expectedOutput: 3628800, executionOrder: 4 },
      { input: { n: 12 }, expectedOutput: 479001600, executionOrder: 5 }
    ]
  },
  {
    problemCode: "DSA-012",
    title: "Fibonacci",
    slug: "fibonacci",
    difficulty: "Easy",
    status: "Published",
    topics: ["Recursion"],
    companies: ["Google", "Amazon", "Meta"],
    pattern: "Recursion",
    descriptionMarkdown: `The **Fibonacci numbers**, commonly denoted \`f(n)\`, form a sequence called the **Fibonacci sequence**, such that each number is the sum of the two preceding ones, starting from \`0\` and \`1\`. That is:

- \`f(0) = 0\`
- \`f(1) = 1\`
- \`f(n) = f(n - 1) + f(n - 2)\`, for \`n > 1\`.

Given \`n\`, calculate \`f(n)\` using **recursion**.`,
    examples: [
      { input: "n = 2", output: "1", explanation: "f(2) = f(1) + f(0) = 1 + 0 = 1", order: 1 },
      { input: "n = 4", output: "3", explanation: "f(4) = f(3) + f(2) = 2 + 1 = 3", order: 2 }
    ],
    constraints: [
      "0 <= n <= 30"
    ],
    hints: [
      "Base cases: n = 0 returns 0, n = 1 returns 1.",
      "Recursive relation: fib(n - 1) + fib(n - 2)."
    ],
    functionDefinition: {
      functionName: "fib",
      parameters: [
        { name: "n", type: "number", required: true }
      ],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { n: 2 }, expectedOutput: 1, order: 1 },
      { input: { n: 3 }, expectedOutput: 2, order: 2 }
    ],
    hiddenTestCases: [
      { input: { n: 0 }, expectedOutput: 0, executionOrder: 1 },
      { input: { n: 1 }, expectedOutput: 1, executionOrder: 2 },
      { input: { n: 6 }, expectedOutput: 8, executionOrder: 3 },
      { input: { n: 10 }, expectedOutput: 55, executionOrder: 4 },
      { input: { n: 20 }, expectedOutput: 6765, executionOrder: 5 },
      { input: { n: 30 }, expectedOutput: 832040, executionOrder: 6 }
    ]
  },
  {
    problemCode: "DSA-013",
    title: "Power Function",
    slug: "power-function",
    difficulty: "Medium",
    status: "Published",
    topics: ["Recursion"],
    companies: ["Google", "Meta", "Microsoft"],
    pattern: "Divide and Conquer",
    descriptionMarkdown: `Implement \`x^n\`, which calculates \`x\` raised to the power \`n\` (\`x^n\`) using divide-and-conquer **recursion** (**binary exponentiation**).`,
    examples: [
      { input: "x = 2.00000, n = 10", output: "1024.00000", explanation: "2^10 = 1024", order: 1 },
      { input: "x = 2.10000, n = 3", output: "9.26100", explanation: "2.1^3 = 9.261", order: 2 }
    ],
    constraints: [
      "-100.0 < x < 100.0",
      "-2^31 <= n <= 2^31 - 1",
      "Either x is not zero or n > 0."
    ],
    hints: [
      "Use divide & conquer recursion: x^n = (x^(n/2))^2 for even n.",
      "For odd n: x^n = x * x^(n - 1).",
      "For negative n: x^(-n) = 1 / (x^n)."
    ],
    functionDefinition: {
      functionName: "myPow",
      parameters: [
        { name: "x", type: "number", required: true },
        { name: "n", type: "number", required: true }
      ],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "FloatToleranceMatch"
    },
    visibleTestCases: [
      { input: { x: 2.0, n: 10 }, expectedOutput: 1024.0, order: 1 },
      { input: { x: 2.1, n: 3 }, expectedOutput: 9.261, order: 2 }
    ],
    hiddenTestCases: [
      { input: { x: 2.0, n: -2 }, expectedOutput: 0.25, executionOrder: 1 },
      { input: { x: 1.0, n: 2147483647 }, expectedOutput: 1.0, executionOrder: 2 },
      { input: { x: -2.0, n: 2 }, expectedOutput: 4.0, executionOrder: 3 },
      { input: { x: -2.0, n: 3 }, expectedOutput: -8.0, executionOrder: 4 },
      { input: { x: 0.5, n: 0 }, expectedOutput: 1.0, executionOrder: 5 }
    ]
  },
  {
    problemCode: "DSA-014",
    title: "Sum of Array",
    slug: "sum-of-array",
    difficulty: "Easy",
    status: "Published",
    topics: ["Recursion", "Array"],
    companies: ["Amazon", "Microsoft"],
    pattern: "Recursion",
    descriptionMarkdown: `Given an array of integers \`nums\`, calculate the sum of all elements using **recursion**.`,
    examples: [
      { input: "nums = [1, 2, 3, 4, 5]", output: "15", explanation: "1 + 2 + 3 + 4 + 5 = 15", order: 1 },
      { input: "nums = [10, -2, 5]", output: "13", explanation: "10 + (-2) + 5 = 13", order: 2 }
    ],
    constraints: [
      "0 <= nums.length <= 1000",
      "-10^4 <= nums[i] <= 10^4"
    ],
    hints: [
      "Base case: If nums is empty or index exceeds bounds, return 0.",
      "Recursive relation: Return nums[idx] + sumHelper(nums, idx + 1)."
    ],
    functionDefinition: {
      functionName: "arraySum",
      parameters: [
        { name: "nums", type: "number[]", required: true }
      ],
      returnType: "number"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "PrimitiveSerializer",
      comparator: "ExactMatch"
    },
    visibleTestCases: [
      { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 15, order: 1 },
      { input: { nums: [10, -2, 5] }, expectedOutput: 13, order: 2 }
    ],
    hiddenTestCases: [
      { input: { nums: [] }, expectedOutput: 0, executionOrder: 1 },
      { input: { nums: [7] }, expectedOutput: 7, executionOrder: 2 },
      { input: { nums: [-5, -10, -15] }, expectedOutput: -30, executionOrder: 3 },
      { input: { nums: [100, 200, 300, 400] }, expectedOutput: 1000, executionOrder: 4 },
      { input: { nums: [0, 0, 0, 0] }, expectedOutput: 0, executionOrder: 5 }
    ]
  },
  {
    problemCode: "DSA-015",
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "Easy",
    status: "Published",
    topics: ["Recursion", "String"],
    companies: ["Amazon", "Google"],
    pattern: "Recursion",
    descriptionMarkdown: `Write a function that reverses an array of characters \`s\` in-place using **recursion** with O(1) extra memory.`,
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "Reverse of s in-place", order: 1 },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "Reverse of s in-place", order: 2 }
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    hints: [
      "Use two pointers (left and right) or recursion to swap elements in-place.",
      "Base case: left >= right, return."
    ],
    functionDefinition: {
      functionName: "reverseString",
      parameters: [
        { name: "s", type: "string[]", required: true }
      ],
      returnType: "void"
    },
    executionProfile: {
      runtimeType: "FUNCTION",
      outputSerializer: "ArraySerializer",
      comparator: "ExactMatch",
      inPlaceMutation: true,
      mutatedParameter: "s"
    },
    visibleTestCases: [
      { input: { s: ["h", "e", "l", "l", "o"] }, expectedOutput: ["o", "l", "l", "e", "h"], order: 1 },
      { input: { s: ["H", "a", "n", "n", "a", "h"] }, expectedOutput: ["h", "a", "n", "n", "a", "H"], order: 2 }
    ],
    hiddenTestCases: [
      { input: { s: ["a"] }, expectedOutput: ["a"], executionOrder: 1 },
      { input: { s: ["r", "a", "c", "e", "c", "a", "r"] }, expectedOutput: ["r", "a", "c", "e", "c", "a", "r"], executionOrder: 2 },
      { input: { s: ["R", "e", "c", "u", "r", "s", "i", "o", "n"] }, expectedOutput: ["n", "o", "i", "s", "r", "u", "c", "e", "R"], executionOrder: 3 },
      { input: { s: ["1", "2", "3", "4", "5"] }, expectedOutput: ["5", "4", "3", "2", "1"], executionOrder: 4 }
    ]
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log("\n===============================================================================");
    console.log("  SEEDING SARTHI DSA PROBLEMS BANK");
    console.log("===============================================================================\n");

    // 1. Seed Topics
    const topicMap = {};
    for (const t of DEFAULT_TOPICS) {
      let topicDoc = await Topic.findOne({ name: t.name });
      if (!topicDoc) {
        topicDoc = await Topic.create(t);
      }
      topicMap[t.name] = topicDoc._id;
    }
    console.log(`✓ Resolved ${Object.keys(topicMap).length} Topics.`);

    // 2. Seed Companies
    const companyMap = {};
    for (const c of DEFAULT_COMPANIES) {
      let compDoc = await Company.findOne({ name: c.name });
      if (!compDoc) {
        compDoc = await Company.create(c);
      }
      companyMap[c.name] = compDoc._id;
    }
    console.log(`✓ Resolved ${Object.keys(companyMap).length} Companies.`);

    // 3. Seed Patterns
    const patternMap = {};
    for (const p of DEFAULT_PATTERNS) {
      let patDoc = await Pattern.findOne({ name: p.name });
      if (!patDoc) {
        patDoc = await Pattern.create(p);
      }
      patternMap[p.name] = patDoc._id;
    }
    console.log(`✓ Resolved ${Object.keys(patternMap).length} Patterns.`);

    // 4. Seed Problems
    let count = 0;
    for (const p of PROBLEMS_DATA) {
      const topicIds = (p.topics || []).map(tName => topicMap[tName]).filter(Boolean);
      const companyIds = (p.companies || []).map(cName => companyMap[cName]).filter(Boolean);
      const patternId = p.pattern ? patternMap[p.pattern] || null : null;

      // Auto-generate starter code across 4 languages
      const starterCode = [
        {
          language: "javascript",
          code: generateStarterCode("javascript", p.functionDefinition, p.executionProfile),
          functionSignature: p.functionDefinition.functionName,
          defaultTemplate: generateStarterCode("javascript", p.functionDefinition, p.executionProfile)
        },
        {
          language: "python",
          code: generateStarterCode("python", p.functionDefinition, p.executionProfile),
          functionSignature: p.functionDefinition.functionName,
          defaultTemplate: generateStarterCode("python", p.functionDefinition, p.executionProfile)
        },
        {
          language: "cpp",
          code: generateStarterCode("cpp", p.functionDefinition, p.executionProfile),
          functionSignature: p.functionDefinition.functionName,
          defaultTemplate: generateStarterCode("cpp", p.functionDefinition, p.executionProfile)
        },
        {
          language: "java",
          code: generateStarterCode("java", p.functionDefinition, p.executionProfile),
          functionSignature: p.functionDefinition.functionName,
          defaultTemplate: generateStarterCode("java", p.functionDefinition, p.executionProfile)
        }
      ];

      const problemPayload = {
        ...p,
        topics: topicIds,
        companies: companyIds,
        pattern: patternId,
        starterCode,
        executionLimits: {
          timeLimitMs: 2000,
          memoryLimitMb: 256
        }
      };

      const existingProblem = await Problem.findOne({
        $or: [{ slug: p.slug }, { problemCode: p.problemCode }]
      });

      if (existingProblem) {
        await Problem.findByIdAndUpdate(existingProblem._id, problemPayload, { new: true });
      } else {
        await Problem.create(problemPayload);
      }
      console.log(`  ✓ Seeded/Updated Problem: [${p.problemCode}] ${p.title} (${p.difficulty})`);
      count++;
    }

    console.log("\n===============================================================================");
    console.log(`  SUCCESSFULLY SEEDED ${count} DSA PROBLEMS INTO MONGODB!`);
    console.log("===============================================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seedDatabase();
