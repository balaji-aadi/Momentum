/**
 * Python Driver Harness Generator
 * Wraps student solution code with imports, node classes, testcase iteration, and JSON result reporting.
 */

export function generatePythonDriverHarness(studentCode, functionDefinition, executionProfile, testCases = []) {
  const functionName = functionDefinition?.name || functionDefinition?.functionName || 'twoSum';
  const parameters = functionDefinition?.parameters || [];
  const paramNames = parameters.map(p => p.name);

  const serializedTCs = JSON.stringify(testCases);

  return `import sys, json, time
from typing import List, Optional

# --- DATA STRUCTURE NODE DEFINITIONS ---
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
    def __init__(self, x: int = 0, next: 'Node' = None, random: 'Node' = None):
        self.val = int(x)
        self.next = next
        self.random = random

# --- INPUT DESERIALIZATION HELPERS ---
def parse_list_node(val):
    if val is None or not isinstance(val, list):
        return val
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
    if val is None or not isinstance(val, list):
        return val
    if len(val) == 0:
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

# --- MEMORY IDENTITY & DEEP COPY HELPERS ---
def collect_original_node_ids(args):
    node_ids = set()
    for arg in args:
        if arg is None:
            continue
        if isinstance(arg, Node):
            curr = arg
            while curr and id(curr) not in node_ids:
                node_ids.add(id(curr))
                curr = curr.next
        elif isinstance(arg, ListNode):
            curr = arg
            while curr and id(curr) not in node_ids:
                node_ids.add(id(curr))
                curr = curr.next
        elif isinstance(arg, TreeNode):
            queue = [arg]
            while queue:
                curr = queue.pop(0)
                if curr and id(curr) not in node_ids:
                    node_ids.add(id(curr))
                    if curr.left: queue.append(curr.left)
                    if curr.right: queue.append(curr.right)
    return node_ids

# --- OUTPUT SERIALIZATION HELPERS ---
def serialize_output(obj, original_node_ids=None):
    if obj is None:
        return None
    if original_node_ids is None:
        original_node_ids = set()

    if isinstance(obj, Node):
        nodes = []
        node_map = {}
        curr = obj
        idx = 0
        while curr and id(curr) not in node_map:
            if id(curr) in original_node_ids:
                raise MemoryError(f"Memory Identity Violation: Returned node at index {idx} is an original node instead of a deep copy.")
            nodes.append(curr)
            node_map[id(curr)] = idx
            curr = curr.next
            idx += 1
        res = []
        for i, n in enumerate(nodes):
            if n.random and id(n.random) in original_node_ids:
                raise MemoryError(f"Memory Identity Violation: Random pointer of node at index {i} targets an original node instead of a deep copy.")
            r_idx = node_map.get(id(n.random)) if n.random else None
            res.append([n.val, r_idx])
        return res
    if isinstance(obj, ListNode):
        res = []
        curr = obj
        visited = set()
        while curr:
            if id(curr) in original_node_ids:
                raise MemoryError("Memory Identity Violation: Returned linked list contains original nodes instead of a deep copy.")
            if id(curr) in visited:
                break
            visited.add(id(curr))
            res.append(curr.val)
            curr = curr.next
        return res
    if isinstance(obj, TreeNode):
        res = []
        queue = [obj]
        while queue:
            curr = queue.pop(0)
            if curr is None:
                res.append(None)
            else:
                if id(curr) in original_node_ids:
                    raise MemoryError("Memory Identity Violation: Returned tree contains original nodes instead of a deep copy.")
                res.append(curr.val)
                queue.append(curr.left)
                queue.append(curr.right)
        while res and res[-1] is None:
            res.pop()
        return res
    return obj

# --- INPUT PARSING HELPER ---
def parse_raw_input_to_args(raw_input, param_names):
    if isinstance(raw_input, dict):
        args = []
        raw_keys = list(raw_input.keys())
        raw_vals = list(raw_input.values())

        generic_aliases = ['head', 'nums', 'arr', 'array', 'values', 'list', 'items', 'elements', 'target', 'k', 'n', 'matrix', 'grid', 's', 'str']

        for idx, name in enumerate(param_names):
            val = raw_input.get(name)

            # Smart generic fallback if parameter name is not identical to generator dictionary key
            if val is None:
                for alias in generic_aliases:
                    if alias in raw_input and alias not in param_names:
                        val = raw_input[alias]
                        break

                # Positional fallback if key count matches parameter count
                if val is None and idx < len(raw_vals):
                    val = raw_vals[idx]

            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except Exception:
                    pass
            if isinstance(val, list) and len(val) > 0:
                if isinstance(val[0], list) and len(val[0]) == 2:
                    val = parse_random_list_node(val)
                elif isinstance(val[0], dict) and "val" in val[0]:
                    val = parse_list_node([x["val"] for x in val])

            args.append(val)
        return args

    if isinstance(raw_input, str):
        try:
            parsed = json.loads(raw_input)
            if isinstance(parsed, dict):
                return parse_raw_input_to_args(parsed, param_names)
            if isinstance(parsed, list):
                if len(parsed) > 0 and isinstance(parsed[0], list) and len(parsed[0]) == 2:
                    return [parse_random_list_node(parsed)]
                return [parsed]
        except Exception:
            pass

    return [raw_input]

# --- STUDENT SOLUTION CODE ---
${studentCode}

# --- DRIVER EXECUTION LOOP ---
def __sarthi_run_driver__():
    test_cases = json.loads(${JSON.stringify(serializedTCs)})
    param_names = ${JSON.stringify(paramNames)}
    
    # Resolve solution callable (class Solution instance or top-level function)
    fn = None
    if 'Solution' in globals() and isinstance(globals()['Solution'], type):
        sol = globals()['Solution']()
        fn = getattr(sol, "${functionName}", None)
        if fn is None:
            # Fallback to any method in Solution
            methods = [getattr(sol, m) for m in dir(sol) if not m.startswith("__") and callable(getattr(sol, m))]
            if methods:
                fn = methods[0]
    
    if fn is None:
        fn = globals().get("${functionName}", None)
    
    if fn is None:
        # Fallback to any user-defined function in globals
        user_fns = [obj for name, obj in globals().items() if callable(obj) and not name.startswith("__") and name not in ['parse_list_node', 'parse_tree_node', 'parse_random_list_node', 'serialize_output', 'parse_raw_input_to_args', '__sarthi_run_driver__', 'ListNode', 'TreeNode', 'Node', 'List', 'Optional']]
        if user_fns:
            fn = user_fns[0]

    if fn is None:
        raise NameError(f"Could not find function '${functionName}' or 'class Solution' in Python solution code.")

    time_limit_ms = ${Number(executionProfile?.timeLimitMs || 2000)}
    execution_report = []

    for idx, tc in enumerate(test_cases):
        raw_input = tc.get("input", {})
        
        # Extract arguments dynamically regardless of string vs dict input
        args = parse_raw_input_to_args(raw_input, param_names)
        original_node_ids = collect_original_node_ids(args)

        try:
            start_time = time.perf_counter()
            res = fn(*args)
            end_time = time.perf_counter()
            exec_time_ms = round((end_time - start_time) * 1000, 3)

            serialized_res = serialize_output(res, original_node_ids)
            
            if exec_time_ms > time_limit_ms:
                execution_report.append({
                    "testCaseIndex": idx,
                    "success": False,
                    "error": f"Time Limit Exceeded ({exec_time_ms}ms > {time_limit_ms}ms limit)",
                    "executionTimeMs": exec_time_ms
                })
            else:
                execution_report.append({
                    "testCaseIndex": idx,
                    "success": True,
                    "actualOutput": serialized_res,
                    "executionTimeMs": exec_time_ms
                })
        except Exception as e:
            execution_report.append({
                "testCaseIndex": idx,
                "success": False,
                "error": str(e),
                "executionTimeMs": 0
            })

    print("__SARTHI_JUDGE_OUTPUT_START__")
    print(json.dumps(execution_report))
    print("__SARTHI_JUDGE_OUTPUT_END__")

if __name__ == "__main__":
    __sarthi_run_driver__()
`;
}
