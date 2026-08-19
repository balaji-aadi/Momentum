import { ProblemConfigurationError } from '../outputSerializers/SerializerErrors.js';

/**
 * JavaScript Driver Harness Generator (Phase 6)
 * Generates a self-contained JavaScript/Node.js driver script around student code.
 * 
 * Official JavaScript Entry-Point Contract:
 * var functionName = function(param1, param2, ...) { ... };
 * Invoked as: functionName(...args)
 */
export function generateJavaScriptDriverHarness(studentCode, functionDefinition, executionProfile = {}, testCases = []) {
  const functionName = functionDefinition?.name || functionDefinition?.functionName || 'twoSum';
  const parameters = functionDefinition?.parameters || [];
  const returnType = functionDefinition?.returnType || 'number[]';
  const inPlaceMutation = executionProfile?.inPlaceMutation === true || returnType === 'void';
  const mutatedParameter = executionProfile?.mutatedParameter;

  if (inPlaceMutation) {
    if (!mutatedParameter) {
      throw new ProblemConfigurationError("Missing required 'executionProfile.mutatedParameter' for in-place mutation problem.");
    }
    const paramExists = parameters.some(p => p.name === mutatedParameter);
    if (!paramExists) {
      throw new ProblemConfigurationError(`Mutated parameter '${mutatedParameter}' not found in functionDefinition parameters.`);
    }
  }

  const serializedTCs = JSON.stringify(testCases);

  return `// ==========================================
// 1. STANDARD DATA STRUCTURE DEFINITIONS
// ==========================================
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}

function Node(val, next, random, neighbors) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
    this.random = (random === undefined ? null : random);
    this.neighbors = (neighbors === undefined ? [] : neighbors);
}

// ==========================================
// 2. RUNTIME INPUT DESERIALIZATION HELPERS
// ==========================================
function parseListNode(val) {
    if (!Array.isArray(val) || val.length === 0) return null;
    const dummy = new ListNode(0);
    let curr = dummy;
    for (const x of val) {
        curr.next = new ListNode(x);
        curr = curr.next;
    }
    return dummy.next;
}

function parseTreeNode(val) {
    if (!Array.isArray(val) || val.length === 0 || val[0] === null) return null;
    const root = new TreeNode(val[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < val.length) {
        const curr = queue.shift();
        if (i < val.length) {
            const leftVal = val[i++];
            if (leftVal !== null && leftVal !== undefined) {
                curr.left = new TreeNode(leftVal);
                queue.push(curr.left);
            }
        }
        if (i < val.length) {
            const rightVal = val[i++];
            if (rightVal !== null && rightVal !== undefined) {
                curr.right = new TreeNode(rightVal);
                queue.push(curr.right);
            }
        }
    }
    return root;
}

function parseRandomListNode(val) {
    if (!Array.isArray(val) || val.length === 0) return null;
    const nodes = [];
    for (const pair of val) {
        const itemVal = Array.isArray(pair) ? pair[0] : (typeof pair === 'number' ? pair : 0);
        nodes.push(new Node(itemVal));
    }
    for (let i = 0; i < val.length; i++) {
        if (i < nodes.length - 1) nodes[i].next = nodes[i + 1];
        const pair = val[i];
        if (Array.isArray(pair) && pair.length > 1 && pair[1] !== null && pair[1] !== undefined) {
            const rIdx = Number(pair[1]);
            if (rIdx >= 0 && rIdx < nodes.length) {
                nodes[i].random = nodes[rIdx];
            }
        }
    }
    return nodes.length > 0 ? nodes[0] : null;
}

function parseGraphNode(val) {
    if (!Array.isArray(val) || val.length === 0) return null;
    if (Array.isArray(val[0])) {
        const nodes = {};
        for (let i = 0; i < val.length; i++) nodes[i + 1] = new Node(i + 1);
        for (let i = 0; i < val.length; i++) {
            const curr = nodes[i + 1];
            for (const nVal of val[i]) {
                if (nodes[nVal]) curr.neighbors.push(nodes[nVal]);
            }
        }
        return nodes[1] || null;
    }
    const nodes = {};
    for (const item of val) {
        if (item && item.val !== undefined) nodes[item.val] = new Node(item.val);
    }
    for (const item of val) {
        if (item && item.val !== undefined) {
            const curr = nodes[item.val];
            for (const nVal of (item.neighbors || [])) {
                if (nodes[nVal]) curr.neighbors.push(nodes[nVal]);
            }
        }
    }
    return val[0] && val[0].val !== undefined ? nodes[val[0].val] : null;
}

// ==========================================
// 3. RUNTIME OUTPUT SERIALIZER (PHASE 4 CONTRACT)
// ==========================================
function serializeOutput(obj) {
    if (obj === null || obj === undefined) return null;
    if (obj instanceof ListNode) {
        const res = [];
        const visited = new Set();
        let curr = obj;
        while (curr) {
            if (visited.has(curr)) throw new Error("CycleDetectedError: Cyclic reference in linked list");
            visited.add(curr);
            res.push(curr.val);
            curr = curr.next;
        }
        return res;
    }
    if (obj instanceof TreeNode) {
        const queue = [obj];
        const res = [];
        while (queue.length > 0) {
            const curr = queue.shift();
            if (curr) {
                res.push(curr.val);
                queue.push(curr.left);
                queue.push(curr.right);
            } else {
                res.push(null);
            }
        }
        while (res.length > 0 && res[res.length - 1] === null) res.pop();
        return res;
    }
    if (obj instanceof Node) {
        if (Array.isArray(obj.neighbors) && (obj.next === null && obj.random === null || obj.neighbors.length > 0)) {
            // GraphNode BFS
            const visited = new Map();
            const queue = [obj];
            visited.set(obj, obj.val);
            const allNodes = [obj];
            while (queue.length > 0) {
                const curr = queue.shift();
                for (const neighbor of (curr.neighbors || [])) {
                    if (!visited.has(neighbor)) {
                        visited.set(neighbor, neighbor.val);
                        queue.push(neighbor);
                        allNodes.push(neighbor);
                    }
                }
            }
            const isOneToV = allNodes.every((n, idx) => n.val === idx + 1);
            if (isOneToV) {
                const adj = [];
                allNodes.sort((a, b) => a.val - b.val);
                for (const n of allNodes) {
                    adj.push((n.neighbors || []).map(nb => nb.val));
                }
                return adj;
            } else {
                allNodes.sort((a, b) => a.val - b.val);
                return allNodes.map(n => ({
                    val: n.val,
                    neighbors: (n.neighbors || []).map(nb => nb.val).sort((a, b) => a - b)
                }));
            }
        } else {
            // RandomListNode
            const nodes = [];
            const nodeMap = new Map();
            let curr = obj;
            let idx = 0;
            while (curr && !nodeMap.has(curr)) {
                nodes.push(curr);
                nodeMap.set(curr, idx++);
                curr = curr.next;
            }
            return nodes.map(n => [n.val, n.random ? nodeMap.get(n.random) : null]);
        }
    }
    return obj;
}

// ==========================================
// 4. INJECTED STUDENT CODE
// ==========================================
${studentCode}

// ==========================================
// 5. DRIVER RUNNER & EXECUTION ENVELOPE
// ==========================================
(function runDriver() {
    const testCases = ${serializedTCs};
    const results = [];

    for (let idx = 0; idx < testCases.length; idx++) {
        try {
            const rawInput = testCases[idx].input !== undefined ? testCases[idx].input : testCases[idx];
            const args = [];
            ${parameters.map((p, i) => {
              const pType = (p.type || '').toLowerCase();
              if (pType.includes('listnode') && !pType.includes('random')) {
                return `args.push(parseListNode(typeof rawInput === 'object' && rawInput !== null && rawInput["${p.name}"] !== undefined ? rawInput["${p.name}"] : rawInput[${i}]));`;
              } else if (pType.includes('randomlistnode')) {
                return `args.push(parseRandomListNode(typeof rawInput === 'object' && rawInput !== null && rawInput["${p.name}"] !== undefined ? rawInput["${p.name}"] : rawInput[${i}]));`;
              } else if (pType.includes('treenode') || pType.includes('binarytree')) {
                return `args.push(parseTreeNode(typeof rawInput === 'object' && rawInput !== null && rawInput["${p.name}"] !== undefined ? rawInput["${p.name}"] : rawInput[${i}]));`;
              } else if (pType.includes('graph')) {
                return `args.push(parseGraphNode(typeof rawInput === 'object' && rawInput !== null && rawInput["${p.name}"] !== undefined ? rawInput["${p.name}"] : rawInput[${i}]));`;
              } else {
                return `args.push(typeof rawInput === 'object' && rawInput !== null && rawInput["${p.name}"] !== undefined ? rawInput["${p.name}"] : rawInput[${i}]);`;
              }
            }).join('\n            ')}

            ${inPlaceMutation ? `
            // In-Place Mutation Execution
            const mutatedIdx = ${parameters.findIndex(p => p.name === mutatedParameter)};
            ${functionName}(...args);
            const output = serializeOutput(args[mutatedIdx]);
            ` : `
            const result = ${functionName}(...args);
            const output = serializeOutput(result);
            `}

            results.push({
                testCaseIndex: idx,
                output: output
            });
        } catch (err) {
            console.log(JSON.stringify({
                status: "RUNTIME_ERROR",
                testCaseIndex: idx,
                errorType: err.name || "Error",
                message: err.message
            }));
            return;
        }
    }

    console.log(JSON.stringify({
        status: "SUCCESS",
        results: results
    }));
})();
`;
}
