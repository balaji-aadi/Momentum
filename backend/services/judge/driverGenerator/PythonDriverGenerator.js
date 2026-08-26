import { ProblemConfigurationError } from '../outputSerializers/SerializerErrors.js';
import { SemanticValidatorRegistry } from '../validators/SemanticValidatorRegistry.js';

/**
 * Python Driver Harness Generator (Phase 6)
 * Generates a self-contained Python 3 driver script around student code.
 */
export function generatePythonDriverHarness(studentCode, functionDefinition, executionProfile = {}, testCases = []) {
  const functionName = functionDefinition?.name || functionDefinition?.functionName || 'twoSum';
  const parameters = functionDefinition?.parameters || [];
  const returnType = functionDefinition?.returnType || 'number[]';
  const inPlaceMutation = executionProfile?.inPlaceMutation === true || returnType === 'void';
  const mutatedParameter = executionProfile?.mutatedParameter;
  const semanticValidator = executionProfile?.semanticValidator;

  if (semanticValidator) {
    SemanticValidatorRegistry.assertValid(semanticValidator);
  }

  if (inPlaceMutation) {
    const cleanMutated = (mutatedParameter || '').trim();
    if (!cleanMutated) {
      throw new ProblemConfigurationError("Missing required 'executionProfile.mutatedParameter' for in-place mutation problem.");
    }
    const paramExists = parameters.some(p => {
      const pName = typeof p === 'string' ? p : (p.name || (p.toObject ? p.toObject().name : '') || '');
      return pName.trim() === cleanMutated;
    });
    if (!paramExists) {
      throw new ProblemConfigurationError(`Mutated parameter '${cleanMutated}' not found in functionDefinition parameters.`);
    }
  }

  const serializedTCs = JSON.stringify(testCases);
  const validationHelpersCode = SemanticValidatorRegistry.getInjectedValidationCode('python', semanticValidator);

  return `import sys, json, time
from typing import List, Optional

# ==========================================
# 1. STANDARD DATA STRUCTURE DEFINITIONS
# ==========================================
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, next=None, random=None, neighbors=None):
        self.val = int(val)
        self.next = next
        self.random = random
        self.neighbors = neighbors if neighbors is not None else []

# ==========================================
# 2. RUNTIME INPUT DESERIALIZATION HELPERS
# ==========================================
def parse_list_node(val):
    if val is None or not isinstance(val, list):
        return None
    if len(val) == 0:
        return None
    dummy = ListNode(0)
    curr = dummy
    for x in val:
        curr.next = ListNode(x)
        curr = curr.next
    return dummy.next

def parse_tree_node(val):
    if val is None or not isinstance(val, list) or len(val) == 0 or val[0] is None:
        return None
    root = TreeNode(val[0])
    queue = [root]
    i = 1
    while queue and i < len(val):
        curr = queue.pop(0)
        if i < len(val):
            left_val = val[i]
            i += 1
            if left_val is not None:
                curr.left = TreeNode(left_val)
                queue.append(curr.left)
        if i < len(val):
            right_val = val[i]
            i += 1
            if right_val is not None:
                curr.right = TreeNode(right_val)
                queue.append(curr.right)
    return root

def parse_random_list_node(val):
    if val is None or not isinstance(val, list) or len(val) == 0:
        return None
    nodes = []
    for pair in val:
        if isinstance(pair, list) and len(pair) > 0:
            nodes.append(Node(pair[0]))
        elif isinstance(pair, (int, float)):
            nodes.append(Node(int(pair)))
        else:
            nodes.append(Node(0))
    for i, pair in enumerate(val):
        if i < len(nodes) - 1:
            nodes[i].next = nodes[i + 1]
        if isinstance(pair, list) and len(pair) > 1 and pair[1] is not None:
            try:
                r_idx = int(pair[1])
                if 0 <= r_idx < len(nodes):
                    nodes[i].random = nodes[r_idx]
            except Exception:
                pass
    return nodes[0] if nodes else None

def parse_graph_node(val):
    if val is None or not isinstance(val, list) or len(val) == 0:
        return None
    # 1. Standard 1..V Adjacency Arrays
    if isinstance(val[0], list):
        nodes = {i + 1: Node(i + 1, neighbors=[]) for i in range(len(val))}
        for i, neighbors in enumerate(val):
            curr_node = nodes[i + 1]
            for n_val in neighbors:
                if n_val in nodes:
                    curr_node.neighbors.append(nodes[n_val])
        return nodes[1] if 1 in nodes else None
    # 2. Labeled Node Descriptors [{ "val": 10, "neighbors": [20, 50] }, ...]
    nodes = {}
    for item in val:
        if isinstance(item, dict) and "val" in item:
            nodes[item["val"]] = Node(item["val"], neighbors=[])
    for item in val:
        if isinstance(item, dict) and "val" in item:
            curr_node = nodes[item["val"]]
            for n_val in item.get("neighbors", []):
                if n_val in nodes:
                    curr_node.neighbors.append(nodes[n_val])
    first_key = val[0].get("val") if isinstance(val[0], dict) else None
    return nodes.get(first_key) if first_key in nodes else None

${validationHelpersCode}

# ==========================================
# 3. RUNTIME OUTPUT SERIALIZER (PHASE 4 CONTRACT)
# ==========================================
def serialize_output(obj):
    if obj is None:
        return None
    if isinstance(obj, ListNode):
        res = []
        curr = obj
        visited = set()
        while curr:
            if id(curr) in visited:
                raise RuntimeError("CycleDetectedError: Cyclic reference in linked list")
            visited.add(id(curr))
            res.append(curr.val)
            curr = curr.next
        return res
    if isinstance(obj, TreeNode):
        queue = [obj]
        res = []
        while queue:
            curr = queue.pop(0)
            if curr:
                res.append(curr.val)
                queue.append(curr.left)
                queue.append(curr.right)
            else:
                res.append(None)
        while res and res[-1] is None:
            res.pop()
        return res
    if "${executionProfile?.outputSerializer || ''}" == "RandomListSerializer":
        # RandomListNode
        nodes = []
        node_map = {}
        curr = obj
        idx = 0
        while curr and id(curr) not in node_map:
            nodes.append(curr)
            node_map[id(curr)] = idx
            curr = curr.next
            idx += 1
        res = []
        for n in nodes:
            r_idx = node_map.get(id(n.random)) if n.random else None
            res.append([n.val, r_idx])
        return res
    if "${executionProfile?.outputSerializer || ''}" == "GraphNodeSerializer" or isinstance(obj, Node):
        # GraphNode BFS
        visited = {}
        queue = [obj]
        visited[id(obj)] = obj
        while queue:
            curr = queue.pop(0)
            for neighbor in (curr.neighbors if hasattr(curr, 'neighbors') and curr.neighbors is not None else []):
                if id(neighbor) not in visited:
                    visited[id(neighbor)] = neighbor
                    queue.append(neighbor)
        all_nodes = list(visited.values())
        sorted_nodes = sorted(all_nodes, key=lambda x: x.val)
        is_one_to_v = all(n.val == idx + 1 for idx, n in enumerate(sorted_nodes)) and len(sorted_nodes) > 0
        if is_one_to_v:
            adj = []
            for n in sorted_nodes:
                adj.append([neighbor.val for neighbor in (n.neighbors if hasattr(n, 'neighbors') and n.neighbors is not None else [])])
            return adj
        else:
            desc = []
            for n in sorted_nodes:
                desc.append({"val": n.val, "neighbors": sorted([nb.val for nb in (n.neighbors if hasattr(n, 'neighbors') and n.neighbors is not None else [])])})
            return desc
    return obj

# ==========================================
# 4. INJECTED STUDENT CODE
# ==========================================
${studentCode}

# ==========================================
# 5. DRIVER RUNNER & EXECUTION ENVELOPE
# ==========================================
def run_driver():
    test_cases = json.loads('''${serializedTCs.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
    results = []
    
    for idx, tc in enumerate(test_cases):
        try:
            raw_input = tc.get("input", tc)
            # Deserialize parameters
            args = []
            ${parameters.map((p, i) => {
              const pType = (p.type || '').toLowerCase();
              if (pType.includes('listnode') && !pType.includes('random')) {
                return `args.append(parse_list_node(raw_input.get("${p.name}") if isinstance(raw_input, dict) else raw_input[${i}]))`;
              } else if (pType.includes('randomlistnode')) {
                return `args.append(parse_random_list_node(raw_input.get("${p.name}") if isinstance(raw_input, dict) else raw_input[${i}]))`;
              } else if (pType.includes('treenode') || pType.includes('binarytree')) {
                return `args.append(parse_tree_node(raw_input.get("${p.name}") if isinstance(raw_input, dict) else raw_input[${i}]))`;
              } else if (pType.includes('graph')) {
                return `args.append(parse_graph_node(raw_input.get("${p.name}") if isinstance(raw_input, dict) else raw_input[${i}]))`;
              } else {
                return `args.append(raw_input.get("${p.name}") if isinstance(raw_input, dict) else raw_input[${i}])`;
              }
            }).join('\n            ')}

            ${semanticValidator === 'DeepCopyValidator' ? 'original_node_ids = collect_original_node_ids(args)' : ''}

            solution = Solution()
            ${inPlaceMutation ? `
            # In-Place Mutation Execution
            # Mutated Parameter: ${mutatedParameter}
            mutated_idx = ${parameters.findIndex(p => p.name === mutatedParameter)}
            solution.${functionName}(*args)
            output = serialize_output(args[mutated_idx])
            ` : `
            result = solution.${functionName}(*args)
            ${semanticValidator === 'DeepCopyValidator' ? 'validate_deep_copy(result, original_node_ids)' : ''}
            output = serialize_output(result)
            `}

            results.append({
                "testCaseIndex": idx,
                "output": output
            })
        except Exception as e:
            print(json.dumps({
                "status": "RUNTIME_ERROR",
                "testCaseIndex": idx,
                "errorType": type(e).__name__,
                "message": str(e)
            }))
            sys.exit(0)

    print(json.dumps({
        "status": "SUCCESS",
        "results": results
    }))

if __name__ == '__main__':
    run_driver()
`;
}
