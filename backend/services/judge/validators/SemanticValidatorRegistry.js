import { UnsupportedSemanticValidatorError } from './ValidatorErrors.js';

/**
 * Semantic Validator Registry (Phase 4.5)
 * Manages declarative semantic validation contracts (e.g. DeepCopyValidator)
 * and generates in-sandbox validation helper snippets for language driver harnesses.
 */
export class SemanticValidatorRegistry {
  static VALIDATORS = new Set([
    'DeepCopyValidator'
  ]);

  /**
   * Checks whether a semantic validator name is registered.
   * @param {string} validatorName 
   * @returns {boolean}
   */
  static isValid(validatorName) {
    if (!validatorName) return true;
    return this.VALIDATORS.has(validatorName);
  }

  /**
   * Asserts that a semantic validator name is valid; throws UnsupportedSemanticValidatorError if invalid.
   * @param {string} validatorName 
   */
  static assertValid(validatorName) {
    if (!validatorName) return;
    if (!this.VALIDATORS.has(validatorName)) {
      throw new UnsupportedSemanticValidatorError(validatorName);
    }
  }

  /**
   * Generates in-sandbox code snippets for a specified language and validator.
   * @param {string} language ('python', 'javascript', 'cpp', 'java')
   * @param {string} validatorName 
   * @returns {string} Injected code string
   */
  static getInjectedValidationCode(language, validatorName) {
    if (!validatorName) return '';
    this.assertValid(validatorName);

    const lang = (language || '').toLowerCase().trim();

    if (validatorName === 'DeepCopyValidator') {
      switch (lang) {
        case 'python':
        case 'python3':
        case 'py':
          return `
# --- SEMANTIC VALIDATION HELPERS (DeepCopyValidator) ---
def collect_original_node_ids(args):
    node_ids = set()
    visited = set()
    def traverse(obj):
        if obj is None or id(obj) in visited:
            return
        visited.add(id(obj))
        if isinstance(obj, (Node, ListNode, TreeNode)):
            node_ids.add(id(obj))
            if hasattr(obj, 'next') and obj.next: traverse(obj.next)
            if hasattr(obj, 'random') and obj.random: traverse(obj.random)
            if hasattr(obj, 'neighbors') and obj.neighbors:
                for nb in obj.neighbors: traverse(nb)
            if hasattr(obj, 'left') and obj.left: traverse(obj.left)
            if hasattr(obj, 'right') and obj.right: traverse(obj.right)
            if hasattr(obj, 'children') and obj.children:
                for ch in obj.children: traverse(ch)
        elif isinstance(obj, list):
            for item in obj: traverse(item)
    for arg in args:
        traverse(arg)
    return node_ids

def validate_deep_copy(result, original_node_ids):
    visited = set()
    def check(obj):
        if obj is None or id(obj) in visited:
            return
        visited.add(id(obj))
        if isinstance(obj, (Node, ListNode, TreeNode)):
            if id(obj) in original_node_ids:
                raise MemoryError("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.")
            if hasattr(obj, 'next') and obj.next: check(obj.next)
            if hasattr(obj, 'random') and obj.random: check(obj.random)
            if hasattr(obj, 'neighbors') and obj.neighbors:
                for nb in obj.neighbors: check(nb)
            if hasattr(obj, 'left') and obj.left: check(obj.left)
            if hasattr(obj, 'right') and obj.right: check(obj.right)
            if hasattr(obj, 'children') and obj.children:
                for ch in obj.children: check(ch)
        elif isinstance(obj, list):
            for item in obj: check(item)
    check(result)
`;

        case 'javascript':
        case 'js':
        case 'node':
        case 'nodejs':
          return `
// --- SEMANTIC VALIDATION HELPERS (DeepCopyValidator) ---
function collectOriginalNodeIds(args) {
    const nodeIds = new Set();
    const visited = new Set();
    function traverse(obj) {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
        visited.add(obj);
        if (obj instanceof Node || obj instanceof ListNode || obj instanceof TreeNode) {
            nodeIds.add(obj);
            if (obj.next) traverse(obj.next);
            if (obj.random) traverse(obj.random);
            if (Array.isArray(obj.neighbors)) {
                for (const nb of obj.neighbors) traverse(nb);
            }
            if (obj.left) traverse(obj.left);
            if (obj.right) traverse(obj.right);
            if (Array.isArray(obj.children)) {
                for (const ch of obj.children) traverse(ch);
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) traverse(item);
        }
    }
    for (const arg of args) traverse(arg);
    return nodeIds;
}

function validateDeepCopy(result, originalNodeIds) {
    const visited = new Set();
    function check(obj) {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
        visited.add(obj);
        if (obj instanceof Node || obj instanceof ListNode || obj instanceof TreeNode) {
            if (originalNodeIds.has(obj)) {
                throw new Error("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
            }
            if (obj.next) check(obj.next);
            if (obj.random) check(obj.random);
            if (Array.isArray(obj.neighbors)) {
                for (const nb of obj.neighbors) check(nb);
            }
            if (obj.left) check(obj.left);
            if (obj.right) check(obj.right);
            if (Array.isArray(obj.children)) {
                for (const ch of obj.children) check(ch);
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) check(item);
        }
    }
    check(result);
}
`;

        case 'cpp':
        case 'c++':
        case 'cplusplus':
          return `
// --- SEMANTIC VALIDATION HELPERS (DeepCopyValidator) ---
void collect_original_pointers_recursive(Node* node, std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    orig.insert(static_cast<const void*>(node));
    if (node->next) collect_original_pointers_recursive(node->next, orig, visited);
    if (node->random) collect_original_pointers_recursive(node->random, orig, visited);
    for (Node* nb : node->neighbors) {
        if (nb) collect_original_pointers_recursive(nb, orig, visited);
    }
}
void collect_original_pointers_list(ListNode* node, std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    orig.insert(static_cast<const void*>(node));
    if (node->next) collect_original_pointers_list(node->next, orig, visited);
}
void collect_original_pointers_tree(TreeNode* node, std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    orig.insert(static_cast<const void*>(node));
    if (node->left) collect_original_pointers_tree(node->left, orig, visited);
    if (node->right) collect_original_pointers_tree(node->right, orig, visited);
}

void validate_deep_copy_recursive(Node* node, const std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    if (orig.count(static_cast<const void*>(node))) {
        throw std::runtime_error("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
    }
    if (node->next) validate_deep_copy_recursive(node->next, orig, visited);
    if (node->random) validate_deep_copy_recursive(node->random, orig, visited);
    for (Node* nb : node->neighbors) {
        if (nb) validate_deep_copy_recursive(nb, orig, visited);
    }
}
void validate_deep_copy_list(ListNode* node, const std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    if (orig.count(static_cast<const void*>(node))) {
        throw std::runtime_error("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
    }
    if (node->next) validate_deep_copy_list(node->next, orig, visited);
}
void validate_deep_copy_tree(TreeNode* node, const std::unordered_set<const void*>& orig, std::unordered_set<const void*>& visited) {
    if (!node || visited.count(static_cast<const void*>(node))) return;
    visited.insert(static_cast<const void*>(node));
    if (orig.count(static_cast<const void*>(node))) {
        throw std::runtime_error("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
    }
    if (node->left) validate_deep_copy_tree(node->left, orig, visited);
    if (node->right) validate_deep_copy_tree(node->right, orig, visited);
}
`;

        case 'java':
          return `
// --- SEMANTIC VALIDATION HELPERS (DeepCopyValidator) ---
// Collision-safe reference identity tracking using IdentityHashMap
public static void collectOriginalNodes(Object obj, Set<Object> orig, Set<Object> visited) {
    if (obj == null || visited.contains(obj)) return;
    visited.add(obj);
    if (obj instanceof Node) {
        Node n = (Node) obj;
        orig.add(n);
        if (n.next != null) collectOriginalNodes(n.next, orig, visited);
        if (n.random != null) collectOriginalNodes(n.random, orig, visited);
        if (n.neighbors != null) {
            for (Node nb : n.neighbors) collectOriginalNodes(nb, orig, visited);
        }
    } else if (obj instanceof ListNode) {
        ListNode n = (ListNode) obj;
        orig.add(n);
        if (n.next != null) collectOriginalNodes(n.next, orig, visited);
    } else if (obj instanceof TreeNode) {
        TreeNode n = (TreeNode) obj;
        orig.add(n);
        if (n.left != null) collectOriginalNodes(n.left, orig, visited);
        if (n.right != null) collectOriginalNodes(n.right, orig, visited);
    } else if (obj instanceof List) {
        for (Object item : (List<?>) obj) collectOriginalNodes(item, orig, visited);
    }
}

public static void validateDeepCopy(Object obj, Set<Object> orig, Set<Object> visited) {
    if (obj == null || visited.contains(obj)) return;
    visited.add(obj);
    if (obj instanceof Node) {
        Node n = (Node) obj;
        if (orig.contains(n)) {
            throw new RuntimeException("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
        }
        if (n.next != null) validateDeepCopy(n.next, orig, visited);
        if (n.random != null) validateDeepCopy(n.random, orig, visited);
        if (n.neighbors != null) {
            for (Node nb : n.neighbors) validateDeepCopy(nb, orig, visited);
        }
    } else if (obj instanceof ListNode) {
        ListNode n = (ListNode) obj;
        if (orig.contains(n)) {
            throw new RuntimeException("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
        }
        if (n.next != null) validateDeepCopy(n.next, orig, visited);
    } else if (obj instanceof TreeNode) {
        TreeNode n = (TreeNode) obj;
        if (orig.contains(n)) {
            throw new RuntimeException("Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.");
        }
        if (n.left != null) validateDeepCopy(n.left, orig, visited);
        if (n.right != null) validateDeepCopy(n.right, orig, visited);
    } else if (obj instanceof List) {
        for (Object item : (List<?>) obj) validateDeepCopy(item, orig, visited);
    }
}
`;

        default:
          return '';
      }
    }
    return '';
  }
}
