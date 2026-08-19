/**
 * Universal Template Generation Engine (TemplateGenerator) - Phase 2
 * 
 * Synthesizes student-facing starter code templates across Python, JavaScript, C++, and Java
 * directly from a problem's Function Definition.
 * 
 * Strict Phase 2 Rules:
 * 1. Canonical data structure types: ListNode, RandomListNode, TreeNode, GraphNode.
 * 2. C++ array parameter generation respects mutation contract.
 * 3. Strict student-facing isolation: Contains NO driver harness, test case assertions, or judge logic.
 */

// 1. Canonical Type Normalization
export function normalizeCanonicalType(type) {
  if (!type || typeof type !== 'string') return '';
  const clean = type.trim();
  const lower = clean.toLowerCase();
  if (lower === 'listnode' || lower === 'linkedlist') return 'ListNode';
  if (lower === 'randomlistnode') return 'RandomListNode';
  if (lower === 'treenode' || lower === 'binarytree') return 'TreeNode';
  if (lower === 'graphnode' || lower === 'graph' || lower === 'graph_node') return 'GraphNode';
  if (lower === 'int') return 'number';
  if (lower === 'float') return 'number';
  if (lower === 'str') return 'string';
  if (lower === 'bool') return 'boolean';
  if (lower === 'int[]' || lower === 'list[int]') return 'number[]';
  if (lower === 'float[]' || lower === 'list[float]') return 'number[]';
  if (lower === 'str[]' || lower === 'list[str]' || lower === 'list[string]') return 'string[]';
  if (lower === 'bool[]' || lower === 'list[bool]') return 'boolean[]';
  if (lower === 'int[][]' || lower === 'matrix' || lower === 'list[list[int]]') return 'number[][]';
  if (lower === 'string[][]' || lower === 'str[][]') return 'string[][]';
  if (lower === 'boolean[][]' || lower === 'bool[][]') return 'boolean[][]';
  return clean;
}

// 2. Data Type Mapping Matrix across supported languages
export const TYPE_MAP = {
  python: {
    'number': 'int',
    'float': 'float',
    'string': 'str',
    'boolean': 'bool',
    'number[]': 'List[int]',
    'string[]': 'List[str]',
    'boolean[]': 'List[bool]',
    'number[][]': 'List[List[int]]',
    'string[][]': 'List[List[str]]',
    'boolean[][]': 'List[List[bool]]',
    'ListNode': 'Optional[ListNode]',
    'RandomListNode': "Optional['Node']",
    'TreeNode': 'Optional[TreeNode]',
    'GraphNode': "Optional['Node']",
    'void': 'None'
  },
  javascript: {
    'number': 'number',
    'float': 'number',
    'string': 'string',
    'boolean': 'boolean',
    'number[]': 'number[]',
    'string[]': 'string[]',
    'boolean[]': 'boolean[]',
    'number[][]': 'number[][]',
    'string[][]': 'string[][]',
    'boolean[][]': 'boolean[][]',
    'ListNode': 'ListNode',
    'RandomListNode': '_Node',
    'TreeNode': 'TreeNode',
    'GraphNode': '_Node',
    'void': 'void'
  },
  cpp: {
    'number': 'int',
    'float': 'double',
    'string': 'string',
    'boolean': 'bool',
    'number[]': 'vector<int>',
    'string[]': 'vector<string>',
    'boolean[]': 'vector<bool>',
    'number[][]': 'vector<vector<int>>',
    'string[][]': 'vector<vector<string>>',
    'boolean[][]': 'vector<vector<bool>>',
    'ListNode': 'ListNode*',
    'RandomListNode': 'Node*',
    'TreeNode': 'TreeNode*',
    'GraphNode': 'Node*',
    'void': 'void'
  },
  java: {
    'number': 'int',
    'float': 'double',
    'string': 'String',
    'boolean': 'boolean',
    'number[]': 'int[]',
    'string[]': 'String[]',
    'boolean[]': 'boolean[]',
    'number[][]': 'int[][]',
    'string[][]': 'String[][]',
    'boolean[][]': 'boolean[][]',
    'ListNode': 'ListNode',
    'RandomListNode': 'Node',
    'TreeNode': 'TreeNode',
    'GraphNode': 'Node',
    'void': 'void'
  }
};

// 3. Structural Header Definitions (LeetCode-style commented definitions)
export const STRUCT_HEADERS = {
  python: {
    ListNode: `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n`,
    TreeNode: `# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\n`,
    RandomListNode: `# Definition for a Node.\n# class Node:\n#     def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):\n#         self.val = int(x)\n#         self.next = next\n#         self.random = random\n\n`,
    GraphNode: `# Definition for a Node.\n# class Node:\n#     def __init__(self, val = 0, neighbors = None):\n#         self.val = val\n#         self.neighbors = neighbors if neighbors is not None else []\n\n`
  },
  javascript: {
    ListNode: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n`,
    TreeNode: `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n`,
    RandomListNode: `/**\n * // Definition for a _Node.\n * function _Node(val, next, random) {\n *    this.val = val;\n *    this.next = next;\n *    this.random = random;\n * };\n */\n`,
    GraphNode: `/**\n * // Definition for a _Node.\n * function _Node(val, neighbors) {\n *    this.val = val === undefined ? 0 : val;\n *    this.neighbors = neighbors === undefined ? [] : neighbors;\n * };\n */\n`
  },
  cpp: {
    ListNode: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n`,
    TreeNode: `/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\n`,
    RandomListNode: `/*\n// Definition for a Node.\nclass Node {\npublic:\n    int val;\n    Node* next;\n    Node* random;\n    \n    Node(int _val) {\n        val = _val;\n        next = NULL;\n        random = NULL;\n    }\n};\n*/\n`,
    GraphNode: `/*\n// Definition for a Node.\nclass Node {\npublic:\n    int val;\n    vector<Node*> neighbors;\n    Node() {\n        val = 0;\n        neighbors = vector<Node*>();\n    }\n    Node(int _val) {\n        val = _val;\n        neighbors = vector<Node*>();\n    }\n    Node(int _val, vector<Node*> _neighbors) {\n        val = _val;\n        neighbors = _neighbors;\n    }\n};\n*/\n`
  },
  java: {
    ListNode: `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\n`,
    TreeNode: `/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\n`,
    RandomListNode: `/*\n// Definition for a Node.\nclass Node {\n    int val;\n    Node next;\n    Node random;\n\n    public Node(int val) {\n        this.val = val;\n        this.next = null;\n        this.random = null;\n    }\n}\n*/\n`,
    GraphNode: `/*\n// Definition for a Node.\nclass Node {\n    public int val;\n    public List<Node> neighbors;\n    public Node() {\n        val = 0;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val) {\n        val = _val;\n        neighbors = new ArrayList<Node>();\n    }\n    public Node(int _val, ArrayList<Node> _neighbors) {\n        val = _val;\n        neighbors = _neighbors;\n    }\n}\n*/\n`
  }
};

/**
 * Detects which canonical structures are present in parameters or return type.
 */
function getReferencedStructures(parameters = [], returnType = '') {
  const referenced = new Set();
  const allTypes = [...parameters.map(p => p.type), returnType];

  for (const t of allTypes) {
    const canonical = normalizeCanonicalType(t);
    if (STRUCT_HEADERS.python[canonical]) {
      referenced.add(canonical);
    }
  }

  return Array.from(referenced);
}

/**
 * Validates identifier names against reserved words and syntax rules.
 */
export function sanitizeIdentifier(name, defaultFallback = 'solution') {
  if (!name || typeof name !== 'string') return defaultFallback;
  const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || /^[0-9]/.test(clean)) return `_${clean || defaultFallback}`;
  return clean;
}

/**
 * Generate Python Starter Code Boilerplate
 */
export function generatePythonTemplate(fnDef, executionProfile = {}) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const cleanFnName = sanitizeIdentifier(functionName);
  const canonicalReturnType = normalizeCanonicalType(returnType);
  const pyReturnType = TYPE_MAP.python[canonicalReturnType] || 'None';

  const referencedStructs = getReferencedStructures(parameters, returnType);

  let imports = 'from typing import List, Optional\n\n';
  let structHeaders = '';
  for (const struct of referencedStructs) {
    structHeaders += STRUCT_HEADERS.python[struct] || '';
  }

  const paramList = parameters.map(p => {
    const canonicalParamType = normalizeCanonicalType(p.type);
    const pyType = TYPE_MAP.python[canonicalParamType] || p.type;
    const cleanParamName = sanitizeIdentifier(p.name, 'param');
    return `${cleanParamName}: ${pyType}`;
  }).join(', ');

  const selfParam = paramList ? `self, ${paramList}` : 'self';
  const returnAnnotation = ` -> ${pyReturnType}`;

  const isInPlace = executionProfile?.inPlaceMutation || canonicalReturnType === 'void';
  const mutatedParam = executionProfile?.mutatedParameter || (parameters[0] ? parameters[0].name : 'input');

  let body = '        # Write your solution here\n        pass\n';
  if (isInPlace) {
    body = `        # Do not return anything, modify ${mutatedParam} in-place instead.\n        pass\n`;
  }

  return `${imports}${structHeaders}class Solution:\n    def ${cleanFnName}(${selfParam})${returnAnnotation}:\n${body}`;
}

/**
 * Generate JavaScript Starter Code Boilerplate
 */
export function generateJavaScriptTemplate(fnDef, executionProfile = {}) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const cleanFnName = sanitizeIdentifier(functionName);
  const canonicalReturnType = normalizeCanonicalType(returnType);
  const jsRetType = TYPE_MAP.javascript[canonicalReturnType] || 'void';

  const referencedStructs = getReferencedStructures(parameters, returnType);
  let structHeaders = '';
  for (const struct of referencedStructs) {
    structHeaders += STRUCT_HEADERS.javascript[struct] || '';
  }

  let jsDoc = '/**\n';
  parameters.forEach(p => {
    const canonicalParamType = normalizeCanonicalType(p.type);
    const jsType = TYPE_MAP.javascript[canonicalParamType] || p.type;
    const cleanParamName = sanitizeIdentifier(p.name, 'param');
    jsDoc += ` * @param {${jsType}} ${cleanParamName}\n`;
  });
  jsDoc += ` * @return {${jsRetType}}\n */\n`;

  const paramList = parameters.map(p => sanitizeIdentifier(p.name, 'param')).join(', ');

  const isInPlace = executionProfile?.inPlaceMutation || canonicalReturnType === 'void';
  const mutatedParam = executionProfile?.mutatedParameter || (parameters[0] ? parameters[0].name : 'input');

  let body = '    // Write your solution here\n';
  if (isInPlace) {
    body = `    // Do not return anything, modify ${mutatedParam} in-place instead.\n`;
  }

  return `${structHeaders}${jsDoc}var ${cleanFnName} = function(${paramList}) {\n${body}};\n`;
}

/**
 * Generate C++ Starter Code Boilerplate
 */
export function generateCppTemplate(fnDef, executionProfile = {}) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const cleanFnName = sanitizeIdentifier(functionName);
  const canonicalReturnType = normalizeCanonicalType(returnType);
  const cppReturnType = TYPE_MAP.cpp[canonicalReturnType] || canonicalReturnType;

  const referencedStructs = getReferencedStructures(parameters, returnType);
  let structHeaders = '';
  for (const struct of referencedStructs) {
    structHeaders += STRUCT_HEADERS.cpp[struct] || '';
  }

  const isInPlace = executionProfile?.inPlaceMutation || canonicalReturnType === 'void';
  const mutatedParam = executionProfile?.mutatedParameter || (parameters[0] ? parameters[0].name : '');

  const paramList = parameters.map(p => {
    const canonicalParamType = normalizeCanonicalType(p.type);
    const cppType = TYPE_MAP.cpp[canonicalParamType] || p.type;
    const cleanParamName = sanitizeIdentifier(p.name, 'param');

    // C++ Array Parameter Generation Rule:
    // If it's a vector or string, pass by reference:
    // - If it is the mutatedParameter in an in-place mutation problem: non-const reference `vector<T>&`
    // - Otherwise: standard `vector<T>&` (preventing O(N) copy overhead)
    const isReference = cppType.startsWith('vector<') || cppType === 'string';
    return isReference ? `${cppType}& ${cleanParamName}` : `${cppType} ${cleanParamName}`;
  }).join(', ');

  let body = '        // Write your solution here\n';
  if (isInPlace) {
    body = `        // Do not return anything, modify ${mutatedParam || 'input'} in-place instead.\n`;
  }

  return `${structHeaders}class Solution {\npublic:\n    ${cppReturnType} ${cleanFnName}(${paramList}) {\n${body}    }\n};\n`;
}

/**
 * Generate Java Starter Code Boilerplate
 */
export function generateJavaTemplate(fnDef, executionProfile = {}) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const cleanFnName = sanitizeIdentifier(functionName);
  const canonicalReturnType = normalizeCanonicalType(returnType);
  const javaReturnType = TYPE_MAP.java[canonicalReturnType] || canonicalReturnType;

  const referencedStructs = getReferencedStructures(parameters, returnType);
  let structHeaders = '';
  for (const struct of referencedStructs) {
    structHeaders += STRUCT_HEADERS.java[struct] || '';
  }

  const isInPlace = executionProfile?.inPlaceMutation || canonicalReturnType === 'void';
  const mutatedParam = executionProfile?.mutatedParameter || (parameters[0] ? parameters[0].name : '');

  const paramList = parameters.map(p => {
    const canonicalParamType = normalizeCanonicalType(p.type);
    const javaType = TYPE_MAP.java[canonicalParamType] || p.type;
    const cleanParamName = sanitizeIdentifier(p.name, 'param');
    return `${javaType} ${cleanParamName}`;
  }).join(', ');

  let body = '        // Write your solution here\n';
  if (isInPlace) {
    body = `        // Do not return anything, modify ${mutatedParam || 'input'} in-place instead.\n`;
  }

  return `${structHeaders}class Solution {\n    public ${javaReturnType} ${cleanFnName}(${paramList}) {\n${body}    }\n}\n`;
}

/**
 * Generates starter templates for all 4 supported languages in a single call.
 */
export function generateAllStarterTemplates(fnDef, executionProfile = {}) {
  return {
    python: generatePythonTemplate(fnDef, executionProfile),
    javascript: generateJavaScriptTemplate(fnDef, executionProfile),
    cpp: generateCppTemplate(fnDef, executionProfile),
    java: generateJavaTemplate(fnDef, executionProfile)
  };
}

/**
 * Dispatcher to generate starter code for any requested target language.
 */
export function generateStarterCode(arg1, arg2 = 'python', arg3 = {}) {
  let fnDef = arg1;
  let language = arg2;
  let executionProfile = arg3;

  if (typeof arg1 === 'string') {
    language = arg1;
    fnDef = arg2;
    executionProfile = arg3;
  }

  const lang = (language || 'python').toLowerCase();
  switch (lang) {
    case 'javascript':
    case 'js':
      return generateJavaScriptTemplate(fnDef, executionProfile);
    case 'cpp':
    case 'c++':
      return generateCppTemplate(fnDef, executionProfile);
    case 'java':
      return generateJavaTemplate(fnDef, executionProfile);
    case 'python':
    case 'py':
      return generatePythonTemplate(fnDef, executionProfile);
    default:
      throw new Error(`UnsupportedLanguageError: Language '${language}' is not supported. Supported languages: python, javascript, cpp, java`);
  }
}
