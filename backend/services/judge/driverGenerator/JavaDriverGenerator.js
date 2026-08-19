import { ProblemConfigurationError } from '../outputSerializers/SerializerErrors.js';

/**
 * Java Driver Harness Generator (Phase 6)
 * Generates a self-contained Java driver source file around student code.
 */
export function generateJavaDriverHarness(studentCode, functionDefinition, executionProfile = {}, testCases = []) {
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

  return `import java.util.*;
import java.io.*;

// ==========================================
// 1. STANDARD DATA STRUCTURE DEFINITIONS
// ==========================================
class ListNode {
    public int val;
    public ListNode next;
    public ListNode() {}
    public ListNode(int val) { this.val = val; }
    public ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    public int val;
    public TreeNode left;
    public TreeNode right;
    public TreeNode() {}
    public TreeNode(int val) { this.val = val; }
    public TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Node {
    public int val;
    public Node next;
    public Node random;
    public List<Node> neighbors;

    public Node() {
        this.val = 0;
        this.neighbors = new ArrayList<>();
    }
    public Node(int _val) {
        this.val = _val;
        this.neighbors = new ArrayList<>();
    }
    public Node(int _val, Node _next, Node _random) {
        this.val = _val;
        this.next = _next;
        this.random = _random;
        this.neighbors = new ArrayList<>();
    }
    public Node(int _val, ArrayList<Node> _neighbors) {
        this.val = _val;
        this.neighbors = _neighbors;
    }
}

// ==========================================
// 2. INJECTED STUDENT CODE
// ==========================================
${studentCode}

// ==========================================
// 3. MAIN DRIVER & JSON SERIALIZATION (PHASE 4 CONTRACT)
// ==========================================
public class Main {
    public static String escapeJson(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append('"');
        for (char c : s.toCharArray()) {
            if (c == '"') sb.append("\\\\\\\"");
            else if (c == '\\\\') sb.append("\\\\\\\\");
            else if (c == '\\b') sb.append("\\\\b");
            else if (c == '\\f') sb.append("\\\\f");
            else if (c == '\\n') sb.append("\\\\n");
            else if (c == '\\r') sb.append("\\\\r");
            else if (c == '\\t') sb.append("\\\\t");
            else sb.append(c);
        }
        sb.append('"');
        return sb.toString();
    }

    public static String serializeListNode(ListNode head) {
        if (head == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        ListNode curr = head;
        Set<ListNode> visited = new HashSet<>();
        boolean first = true;
        while (curr != null) {
            if (visited.contains(curr)) throw new RuntimeException("CycleDetectedError: Cyclic reference in linked list");
            visited.add(curr);
            if (!first) sb.append(",");
            sb.append(curr.val);
            first = false;
            curr = curr.next;
        }
        sb.append("]");
        return sb.toString();
    }

    public static String serializeTreeNode(TreeNode root) {
        if (root == null) return "[]";
        List<String> list = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while (!q.isEmpty()) {
            TreeNode curr = q.poll();
            if (curr != null) {
                list.add(String.valueOf(curr.val));
                q.offer(curr.left);
                q.offer(curr.right);
            } else {
                list.add("null");
            }
        }
        while (!list.isEmpty() && list.get(list.size() - 1).equals("null")) {
            list.remove(list.size() - 1);
        }
        return "[" + String.join(",", list) + "]";
    }

    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            // Output transport envelope
            System.out.println("{\\"status\\":\\"SUCCESS\\",\\"results\\":[]}");
        } catch (Exception e) {
            System.out.println("{\\"status\\":\\"RUNTIME_ERROR\\",\\"testCaseIndex\\":0,\\"errorType\\":\\"" + e.getClass().getSimpleName() + "\\",\\"message\\":" + escapeJson(e.getMessage()) + "}");
        }
    }
}
`;
}
