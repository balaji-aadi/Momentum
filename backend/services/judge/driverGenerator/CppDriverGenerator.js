import { ProblemConfigurationError } from '../outputSerializers/SerializerErrors.js';

/**
 * C++ Driver Harness Generator (Phase 6)
 * Generates a self-contained C++17 driver source file around student code.
 */
export function generateCppDriverHarness(studentCode, functionDefinition, executionProfile = {}, testCases = []) {
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

  return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <map>
#include <set>
#include <queue>
#include <algorithm>
#include <iomanip>
#include <stdexcept>

using namespace std;

// ==========================================
// 1. STANDARD DATA STRUCTURE DEFINITIONS
// ==========================================
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

class Node {
public:
    int val;
    Node* next;
    Node* random;
    vector<Node*> neighbors;

    Node() : val(0), next(nullptr), random(nullptr) {}
    Node(int _val) : val(_val), next(nullptr), random(nullptr) {}
    Node(int _val, Node* _next, Node* _random) : val(_val), next(_next), random(_random) {}
    Node(int _val, vector<Node*> _neighbors) : val(_val), next(nullptr), random(nullptr), neighbors(_neighbors) {}
};

// ==========================================
// 2. SAFE JSON SERIALIZATION HELPERS (PHASE 4 CONTRACT)
// ==========================================
string escape_json_string(const string& s) {
    ostringstream oss;
    oss << '"';
    for (char c : s) {
        if (c == '"') oss << "\\\\\\"";
        else if (c == '\\\\') oss << "\\\\\\\\";
        else if (c == '\\b') oss << "\\\\b";
        else if (c == '\\f') oss << "\\\\f";
        else if (c == '\\n') oss << "\\\\n";
        else if (c == '\\r') oss << "\\\\r";
        else if (c == '\\t') oss << "\\\\t";
        else oss << c;
    }
    oss << '"';
    return oss.str();
}

string serialize_int(int val) { return to_string(val); }
string serialize_double(double val) {
    ostringstream oss;
    oss << setprecision(6) << val;
    return oss.str();
}
string serialize_bool(bool val) { return val ? "true" : "false"; }
string serialize_str(const string& val) { return escape_json_string(val); }

template <typename T>
string serialize_1d_array(const vector<T>& arr) {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < arr.size(); ++i) {
        if (i > 0) oss << ",";
        if constexpr (is_same_v<T, string>) oss << escape_json_string(arr[i]);
        else if constexpr (is_same_v<T, bool>) oss << (arr[i] ? "true" : "false");
        else oss << arr[i];
    }
    oss << "]";
    return oss.str();
}

template <typename T>
string serialize_2d_array(const vector<vector<T>>& mat) {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < mat.size(); ++i) {
        if (i > 0) oss << ",";
        oss << serialize_1d_array(mat[i]);
    }
    oss << "]";
    return oss.str();
}

string serialize_list_node(ListNode* head) {
    if (!head) return "[]";
    ostringstream oss;
    oss << "[";
    ListNode* curr = head;
    set<ListNode*> visited;
    bool first = true;
    while (curr) {
        if (visited.count(curr)) throw runtime_error("CycleDetectedError: Cyclic reference in linked list");
        visited.insert(curr);
        if (!first) oss << ",";
        oss << curr->val;
        first = false;
        curr = curr->next;
    }
    oss << "]";
    return oss.str();
}

string serialize_tree_node(TreeNode* root) {
    if (!root) return "[]";
    vector<string> res;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr) {
            res.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            res.push_back("null");
        }
    }
    while (!res.empty() && res.back() == "null") res.pop_back();
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < res.size(); ++i) {
        if (i > 0) oss << ",";
        oss << res[i];
    }
    oss << "]";
    return oss.str();
}

string serialize_random_list_node(Node* head) {
    if (!head) return "[]";
    vector<Node*> nodes;
    map<Node*, int> node_map;
    Node* curr = head;
    int idx = 0;
    while (curr && node_map.find(curr) == node_map.end()) {
        nodes.push_back(curr);
        node_map[curr] = idx++;
        curr = curr->next;
    }
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < nodes.size(); ++i) {
        if (i > 0) oss << ",";
        oss << "[" << nodes[i]->val << ",";
        if (nodes[i]->random && node_map.find(nodes[i]->random) != node_map.end()) {
            oss << node_map[nodes[i]->random];
        } else {
            oss << "null";
        }
        oss << "]";
    }
    oss << "]";
    return oss.str();
}

string serialize_graph_node(Node* node) {
    if (!node) return "[]";
    map<int, Node*> visited;
    queue<Node*> q;
    q.push(node);
    visited[node->val] = node;
    vector<Node*> all_nodes;
    all_nodes.push_back(node);
    while (!q.empty()) {
        Node* curr = q.front();
        q.pop();
        for (Node* neighbor : curr->neighbors) {
            if (neighbor && visited.find(neighbor->val) == visited.end()) {
                visited[neighbor->val] = neighbor;
                q.push(neighbor);
                all_nodes.push_back(neighbor);
            }
        }
    }
    sort(all_nodes.begin(), all_nodes.end(), [](Node* a, Node* b) { return a->val < b->val; });
    bool is_one_to_v = true;
    for (size_t i = 0; i < all_nodes.size(); ++i) {
        if (all_nodes[i]->val != (int)(i + 1)) { is_one_to_v = false; break; }
    }
    ostringstream oss;
    oss << "[";
    if (is_one_to_v) {
        for (size_t i = 0; i < all_nodes.size(); ++i) {
            if (i > 0) oss << ",";
            oss << "[";
            for (size_t j = 0; j < all_nodes[i]->neighbors.size(); ++j) {
                if (j > 0) oss << ",";
                oss << all_nodes[i]->neighbors[j]->val;
            }
            oss << "]";
        }
    } else {
        for (size_t i = 0; i < all_nodes.size(); ++i) {
            if (i > 0) oss << ",";
            oss << "{\\"val\\":" << all_nodes[i]->val << ",\\"neighbors\\":[";
            for (size_t j = 0; j < all_nodes[i]->neighbors.size(); ++j) {
                if (j > 0) oss << ",";
                oss << all_nodes[i]->neighbors[j]->val;
            }
            oss << "]}";
        }
    }
    oss << "]";
    return oss.str();
}

// ==========================================
// 3. INJECTED STUDENT SOLUTION
// ==========================================
${studentCode}

// ==========================================
// 4. MAIN DRIVER & EXECUTION ENVELOPE
// ==========================================
int main() {
    try {
        Solution solution;
        // Output transport envelope
        cout << "{\\"status\\":\\"SUCCESS\\",\\"results\\":[]}" << endl;
    } catch (const exception& e) {
        cout << "{\\"status\\":\\"RUNTIME_ERROR\\",\\"testCaseIndex\\":0,\\"errorType\\":\\"std::exception\\",\\"message\\":" << escape_json_string(e.what()) << "}" << endl;
    }
    return 0;
}
`;
}
