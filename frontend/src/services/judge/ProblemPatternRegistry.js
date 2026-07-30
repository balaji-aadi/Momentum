/**
 * Centralized Problem Pattern Preset Registry
 * Provides pattern generation defaults without duplicating function metadata.
 * Function signature (functionDefinition.parameters) is the single source of truth for parameter names & types.
 */

export const PROBLEM_PATTERNS = [
  {
    id: 'two_sum',
    label: 'Two Sum / Target Pair',
    description: 'Finds pair of elements summing to target. Guarantees valid target pair in generated test cases.',
    generatorName: 'UniquePairGeneratorPlugin',
    validatorRule: 'twoSum',
    comparatorName: 'UnorderedArrayMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'twoSum',
      parameters: [
        { name: 'nums', type: 'array' },
        { name: 'target', type: 'integer' }
      ],
      returnType: 'array'
    },
    defaultTypeConstraints: {
      nums: { minN: 5, maxN: 10, minValue: -100, maxValue: 100 },
      target: { minValue: -200, maxValue: 200 }
    },
    sampleReferenceCode: {
      javascript:
`const map = new Map();
for (let i = 0; i < nums.length; i++) {
  const diff = target - nums[i];
  if (map.has(diff)) return [map.get(diff), i];
  map.set(nums[i], i);
}
return [];`,
      python:
`seen = {}
for i, num in enumerate(nums):
    diff = target - num
    if diff in seen:
        return [seen[diff], i]
    seen[num] = i
return []`
    }
  },
  {
    id: 'linked_list',
    label: 'Singly Linked List',
    description: 'Generates singly linked lists for traversal, reversal, palindrome check, and fast/slow pointer problems.',
    generatorName: 'LinkedListGeneratorProvider',
    validatorRule: 'LinkedListValidator',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'isPalindrome',
      parameters: [
        { name: 'head', type: 'ListNode' }
      ],
      returnType: 'boolean'
    },
    defaultTypeConstraints: {
      head: { minNodes: 3, maxNodes: 10, minValue: 1, maxValue: 9 }
    },
    sampleReferenceCode: {
      javascript:
`if (!head || !head.next) return true;
const vals = [];
let curr = head;
while (curr) {
  vals.push(curr.val);
  curr = curr.next;
}
for (let i = 0; i < Math.floor(vals.length / 2); i++) {
  if (vals[i] !== vals[vals.length - 1 - i]) return false;
}
return true;`,
      python:
`vals = []
curr = head
while curr:
    vals.append(curr.val)
    curr = curr.next
return vals == vals[::-1]`
    }
  },
  {
    id: 'copy_random_list',
    label: 'Random Pointer Linked List',
    description: 'Constructs a deep copy of a linked list where each node has a next and a random pointer.',
    generatorName: 'RandomListGeneratorPlugin',
    validatorRule: 'range',
    comparatorName: 'RandomListMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'copyRandomList',
      parameters: [
        { name: 'head', type: 'RandomListNode' }
      ],
      returnType: 'RandomListNode'
    },
    defaultTypeConstraints: {
      head: { nodeCountMin: 3, nodeCountMax: 10, valueMin: -100, valueMax: 100 }
    },
    sampleReferenceCode: {
      javascript:
`if (!head) return null;
return head;`,
      python:
`if not head:
    return None
old_to_new = {}
curr = head
while curr:
    old_to_new[curr] = Node(curr.val)
    curr = curr.next
curr = head
while curr:
    if curr.next:
        old_to_new[curr].next = old_to_new[curr.next]
    if curr.random:
        old_to_new[curr].random = old_to_new[curr.random]
    curr = curr.next
return old_to_new[head]`
    }
  },
  {
    id: 'binary_search',
    label: 'Binary Search / Sorted Array',
    description: 'Monotonically sorted element arrays for O(log N) search problems.',
    generatorName: 'SortedArrayPlugin',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'search',
      parameters: [
        { name: 'nums', type: 'array' },
        { name: 'target', type: 'integer' }
      ],
      returnType: 'integer'
    },
    defaultTypeConstraints: {
      nums: { minN: 10, maxN: 20, minValue: -500, maxValue: 500 },
      target: { minValue: -500, maxValue: 500 }
    },
    sampleReferenceCode: {
      javascript:
`let left = 0, right = nums.length - 1;
while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (nums[mid] === target) return mid;
  if (nums[mid] < target) left = mid + 1;
  else right = mid - 1;
}
return -1;`,
      python:
`left, right = 0, len(nums) - 1
while left <= right:
    mid = (left + right) // 2
    if nums[mid] == target:
        return mid
    elif nums[mid] < target:
        left = mid + 1
    else:
        right = mid - 1
return -1`
    }
  },
  {
    id: 'sliding_window',
    label: 'Sliding Window',
    description: 'Subarray range query problems over array or string windows.',
    generatorName: 'SlidingWindowPlugin',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'maxSubarraySum',
      parameters: [
        { name: 'nums', type: 'array' },
        { name: 'k', type: 'integer' }
      ],
      returnType: 'integer'
    },
    defaultTypeConstraints: {
      nums: { minN: 8, maxN: 15, minValue: 1, maxValue: 100 },
      k: { minValue: 1, maxValue: 8 }
    },
    sampleReferenceCode: {
      javascript:
`let maxSum = 0, currentSum = 0;
for (let i = 0; i < nums.length; i++) {
  currentSum += nums[i];
  if (i >= k - 1) {
    maxSum = Math.max(maxSum, currentSum);
    currentSum -= nums[i - (k - 1)];
  }
}
return maxSum;`,
      python:
`max_sum = current_sum = 0
for i in range(len(nums)):
    current_sum += nums[i]
    if i >= k - 1:
        max_sum = max(max_sum, current_sum)
        current_sum -= nums[i - (k - 1)]
return max_sum`
    }
  },
  {
    id: 'merge_intervals',
    label: 'Merge / Insert Intervals',
    description: 'Array of start/end range pairs [start, end] with start <= end.',
    generatorName: 'IntervalGeneratorPlugin',
    validatorRule: 'range',
    comparatorName: 'OrderedArrayMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'merge',
      parameters: [
        { name: 'intervals', type: 'matrix' }
      ],
      returnType: 'matrix'
    },
    defaultTypeConstraints: {
      intervals: { minRows: 4, maxRows: 8, minCols: 2, maxCols: 2, minValue: 0, maxValue: 100 }
    },
    sampleReferenceCode: {
      javascript:
`if (!intervals.length) return [];
intervals.sort((a, b) => a[0] - b[0]);
const res = [intervals[0]];
for (let i = 1; i < intervals.length; i++) {
  const last = res[res.length - 1];
  if (intervals[i][0] <= last[1]) {
    last[1] = Math.max(last[1], intervals[i][1]);
  } else {
    res.push(intervals[i]);
  }
}
return res;`,
      python:
`if not intervals:
    return []
intervals.sort(key=lambda x: x[0])
res = [intervals[0]]
for interval in intervals[1:]:
    if interval[0] <= res[-1][1]:
        res[-1][1] = max(res[-1][1], interval[1])
    else:
        res.append(interval)
return res`
    }
  },
  {
    id: 'tree_traversal',
    label: 'Binary Tree Traversal',
    description: 'Level-order binary tree representations [root, left, right, ...].',
    generatorName: 'BalancedTreePlugin',
    validatorRule: 'range',
    comparatorName: 'TreeMatch',
    normalizerName: 'CanonicalizeTree',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'levelOrder',
      parameters: [
        { name: 'root', type: 'tree' }
      ],
      returnType: 'array'
    },
    defaultTypeConstraints: {
      root: { minNodes: 5, maxNodes: 15, minValue: 1, maxValue: 100 }
    },
    sampleReferenceCode: {
      javascript:
`if (!root) return [];
const res = [];
const queue = [root];
while (queue.length) {
  const node = queue.shift();
  if (node) {
    res.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
}
return res;`,
      python:
`if not root:
    return []
res = []
queue = [root]
while queue:
    node = queue.pop(0)
    if node:
        res.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
return res`
    }
  },
  {
    id: 'bst',
    label: 'Binary Search Tree (BST)',
    description: 'Binary trees satisfying Left < Node < Right invariant.',
    generatorName: 'BSTGeneratorPlugin',
    validatorRule: 'bst',
    comparatorName: 'TreeMatch',
    normalizerName: 'CanonicalizeTree',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'isValidBST',
      parameters: [
        { name: 'root', type: 'tree' }
      ],
      returnType: 'boolean'
    },
    defaultTypeConstraints: {
      root: { minNodes: 5, maxNodes: 15, minValue: 1, maxValue: 100 }
    },
    sampleReferenceCode: {
      javascript:
`function check(node, min, max) {
  if (!node) return true;
  if ((min !== null && node.val <= min) || (max !== null && node.val >= max)) return false;
  return check(node.left, min, node.val) && check(node.right, node.val, max);
}
return check(root, null, null);`,
      python:
`def check(node, min_val, max_val):
    if not node:
        return True
    if (min_val is not None and node.val <= min_val) or (max_val is not None and node.val >= max_val):
        return False
    return check(node.left, min_val, node.val) and check(node.right, node.val, max_val)
return check(root, None, None)`
    }
  },
  {
    id: 'graph_connected',
    label: 'Graph (Connectivity / Reachability)',
    description: 'Graphs with 100% vertex reachability from node 0.',
    generatorName: 'ConnectedGraphPlugin',
    validatorRule: 'connectedGraph',
    comparatorName: 'ExactMatch',
    normalizerName: 'CanonicalizeGraph',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'validPath',
      parameters: [
        { name: 'n', type: 'integer' },
        { name: 'graph', type: 'graph' }
      ],
      returnType: 'boolean'
    },
    defaultTypeConstraints: {
      n: { minValue: 1, maxValue: 20 },
      graph: { minV: 5, maxV: 10, minE: 5, maxE: 15, isDirected: false }
    },
    sampleReferenceCode: {
      javascript:
`const visited = new Set([0]);
const queue = [0];
while (queue.length) {
  const curr = queue.shift();
  for (const neighbor of (graph[curr] || [])) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
}
return visited.size === n;`,
      python:
`visited = {0}
queue = [0]
while queue:
    curr = queue.pop(0)
    for neighbor in graph.get(curr, []):
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
return len(visited) == n`
    }
  },
  {
    id: 'dag',
    label: 'Directed Acyclic Graph (DAG)',
    description: 'Directed graphs with guaranteed topological u < v ordering and zero cycles.',
    generatorName: 'DAGPlugin',
    validatorRule: 'dag',
    comparatorName: 'ExactMatch',
    normalizerName: 'CanonicalizeGraph',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'canFinish',
      parameters: [
        { name: 'n', type: 'integer' },
        { name: 'edges', type: 'graph' }
      ],
      returnType: 'boolean'
    },
    defaultTypeConstraints: {
      n: { minValue: 1, maxValue: 20 },
      edges: { minV: 5, maxV: 10, minE: 5, maxE: 15, isDirected: true }
    },
    sampleReferenceCode: {
      javascript:
`const inDegree = new Array(n).fill(0);
edges.forEach(([u, v]) => inDegree[v]++);
const queue = [];
for (let i = 0; i < n; i++) if (inDegree[i] === 0) queue.push(i);
let count = 0;
while (queue.length) {
  const curr = queue.shift();
  count++;
  (graph[curr] || []).forEach(neighbor => {
    if (--inDegree[neighbor] === 0) queue.push(neighbor);
  });
}
return count === n;`,
      python:
`in_degree = [0] * n
for u, v in edges:
    in_degree[v] += 1
queue = [i for i in range(n) if in_degree[i] == 0]
count = 0
while queue:
    curr = queue.pop(0)
    count += 1
    for neighbor in graph.get(curr, []):
        in_degree[neighbor] -= 1
        if in_degree[neighbor] == 0:
            queue.append(neighbor)
return count == n`
    }
  },
  {
    id: 'combination_sum',
    label: 'Combination Sum / Multiset Subsets',
    description: 'Nested subset or combination arrays where order does not matter.',
    generatorName: 'RandomArrayPlugin',
    validatorRule: 'range',
    comparatorName: 'UnorderedNestedArrayMatch',
    normalizerName: 'SortInnerLists',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'combinationSum',
      parameters: [
        { name: 'candidates', type: 'array' },
        { name: 'target', type: 'integer' }
      ],
      returnType: 'matrix'
    },
    defaultTypeConstraints: {
      candidates: { minN: 4, maxN: 8, minValue: 1, maxValue: 20 },
      target: { minValue: 1, maxValue: 30 }
    },
    sampleReferenceCode: {
      javascript:
`const res = [];
function backtrack(start, target, path) {
  if (target === 0) { res.push([...path]); return; }
  if (target < 0) return;
  for (let i = start; i < candidates.length; i++) {
    path.push(candidates[i]);
    backtrack(i, target - candidates[i], path);
    path.pop();
  }
}
backtrack(0, target, []);
return res;`,
      python:
`res = []
def backtrack(start, target, path):
    if target == 0:
        res.append(list(path))
        return
    if target < 0:
        return
    for i in range(start, len(candidates)):
        path.append(candidates[i])
        backtrack(i, target - candidates[i], path)
        path.pop()
backtrack(0, target, [])
return res`
    }
  },
  {
    id: 'word_search',
    label: 'Word Search (Grid + String)',
    description: 'Grid board matrix and target search string.',
    generatorName: 'MatrixPrimitive',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 8,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'exist',
      parameters: [
        { name: 'board', type: 'matrix' },
        { name: 'word', type: 'string' }
      ],
      returnType: 'boolean'
    },
    defaultTypeConstraints: {
      board: { minRows: 3, maxRows: 5, minCols: 3, maxCols: 5, minValue: 65, maxValue: 90 },
      word: { minN: 3, maxN: 6, charset: 'uppercase' }
    },
    sampleReferenceCode: {
      javascript:
`return true;`,
      python:
`return True`
    }
  },
  {
    id: 'n_queens',
    label: 'N-Queens (Integer N)',
    description: 'Backtracking chessboard puzzle for N queens on NxN board.',
    generatorName: 'ArrayPrimitive',
    validatorRule: 'range',
    comparatorName: 'UnorderedNestedArrayMatch',
    normalizerName: 'SortInnerLists',
    defaultRandomCount: 6,
    defaultStressCount: 1,
    defaultFunctionDefinition: {
      name: 'solveNQueens',
      parameters: [
        { name: 'n', type: 'integer' }
      ],
      returnType: 'matrix'
    },
    defaultTypeConstraints: {
      n: { minValue: 4, maxValue: 8 }
    },
    sampleReferenceCode: {
      javascript:
`return [];`,
      python:
`return []`
    }
  },
  {
    id: 'eval_rpn',
    label: 'Evaluate Reverse Polish Notation (RPN)',
    description: 'Generates valid postfix expression token arrays with guaranteed operand stacks and zero division safety.',
    generatorName: 'ExpressionGeneratorPlugin',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'evalRPN',
      parameters: [
        { name: 'tokens', type: 'string[]' }
      ],
      returnType: 'integer'
    },
    defaultTypeConstraints: {
      tokens: { minN: 3, maxN: 15, minValue: -200, maxValue: 200 }
    },
    sampleReferenceCode: {
      javascript:
`const stack = [];
for (const t of tokens) {
  if (t === '+' || t === '-' || t === '*' || t === '/') {
    const b = stack.pop();
    const a = stack.pop();
    if (t === '+') stack.push(a + b);
    else if (t === '-') stack.push(a - b);
    else if (t === '*') stack.push(a * b);
    else if (t === '/') stack.push(Math.trunc(a / b));
  } else {
    stack.push(Number(t));
  }
}
return stack[0];`,
      python:
`stack = []
for t in tokens:
    if t in ("+", "-", "*", "/"):
        b = stack.pop()
        a = stack.pop()
        if t == "+": stack.append(a + b)
        elif t == "-": stack.append(a - b)
        elif t == "*": stack.append(a * b)
        elif t == "/": stack.append(int(a / b))
    else:
        stack.append(int(t))
return stack[0]`
    }
  },
  {
    id: 'decode_string',
    label: 'Encoded Bracket String / Stack Parsing',
    description: 'Generates valid nested bracket encoded strings (e.g. 3[a]2[bc], 3[a2[c]]) for stack string parsing problems.',
    generatorName: 'EncodedStringPlugin',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'decodeString',
      parameters: [
        { name: 's', type: 'string' }
      ],
      returnType: 'string'
    },
    defaultTypeConstraints: {
      s: { maxDepth: 2, maxK: 5 }
    },
    sampleReferenceCode: {
      javascript:
`const stack = [];
let currNum = 0;
let currStr = '';
for (const c of s) {
  if (!isNaN(c)) {
    currNum = currNum * 10 + Number(c);
  } else if (c === '[') {
    stack.push([currStr, currNum]);
    currStr = '';
    currNum = 0;
  } else if (c === ']') {
    const [prevStr, num] = stack.pop();
    currStr = prevStr + currStr.repeat(num);
  } else {
    currStr += c;
  }
}
return currStr;`,
      python:
`stack = []
curr_num = 0
curr_str = ""
for c in s:
    if c.isdigit():
        curr_num = curr_num * 10 + int(c)
    elif c == '[':
        stack.append((curr_str, curr_num))
        curr_str = ""
        curr_num = 0
    elif c == ']':
        prev_str, num = stack.pop()
        curr_str = prev_str + curr_str * num
    else:
        curr_str += c
return curr_str`
    }
  },
  {
    id: 'custom',
    label: 'Custom / Multi-Parameter Pattern',
    description: 'Generic pattern for custom multi-parameter functions (e.g., nums1, nums2, k). Automatically generates random valid values for all parameters in your Function Definition.',
    generatorName: 'RandomArrayPlugin',
    validatorRule: 'range',
    comparatorName: 'ExactMatch',
    normalizerName: '',
    defaultRandomCount: 10,
    defaultStressCount: 2,
    defaultFunctionDefinition: {
      name: 'solution',
      parameters: [
        { name: 'nums', type: 'array' }
      ],
      returnType: 'array'
    },
    defaultTypeConstraints: {
      nums: { minN: 5, maxN: 10, minValue: -100, maxValue: 100 }
    },
    sampleReferenceCode: {
      javascript:
`return nums;`,
      python:
`return nums`
    }
  }
];

export class ProblemPatternRegistry {
  static getPatterns() {
    return PROBLEM_PATTERNS;
  }

  static getPatternById(id) {
    return PROBLEM_PATTERNS.find(p => p.id === id) || PROBLEM_PATTERNS[0];
  }
}
