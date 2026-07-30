/**
 * Universal Template Generation Engine (TemplateGenerator)
 * Automatically compiles student-facing starter code templates for any language
 * (Python, JavaScript, C++, Java) directly from a problem's Function Definition.
 */

// Data Type Mapping Matrix across supported languages
export const TYPE_MAP = {
  python: {
    number: 'int',
    float: 'float',
    string: 'str',
    boolean: 'bool',
    'number[]': 'List[int]',
    'string[]': 'List[str]',
    'boolean[]': 'List[bool]',
    'number[][]': 'List[List[int]]',
    ListNode: 'Optional[ListNode]',
    TreeNode: 'Optional[TreeNode]',
    RandomListNode: 'Optional[Node]',
    Node: 'Optional[Node]'
  },
  javascript: {
    number: 'number',
    float: 'number',
    string: 'string',
    boolean: 'boolean',
    'number[]': 'number[]',
    'string[]': 'string[]',
    'boolean[]': 'boolean[]',
    'number[][]': 'number[][]',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    RandomListNode: 'Node',
    Node: 'Node'
  },
  cpp: {
    number: 'int',
    float: 'double',
    string: 'string',
    boolean: 'bool',
    'number[]': 'vector<int>',
    'string[]': 'vector<string>',
    'boolean[]': 'vector<bool>',
    'number[][]': 'vector<vector<int>>',
    ListNode: 'ListNode*',
    TreeNode: 'TreeNode*',
    RandomListNode: 'Node*',
    Node: 'Node*'
  },
  java: {
    number: 'int',
    float: 'double',
    string: 'String',
    boolean: 'boolean',
    'number[]': 'int[]',
    'string[]': 'String[]',
    'boolean[]': 'boolean[]',
    'number[][]': 'int[][]',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    RandomListNode: 'Node',
    Node: 'Node'
  }
};

/**
 * Generate Python Starter Code Boilerplate
 */
export function generatePythonTemplate(fnDef) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const pyReturnType = TYPE_MAP.python[returnType] || returnType;

  const hasListNode = parameters.some(p => p.type === 'ListNode') || returnType === 'ListNode';
  const hasTreeNode = parameters.some(p => p.type === 'TreeNode') || returnType === 'TreeNode';
  const hasRandomNode = parameters.some(p => p.type === 'RandomListNode' || p.type === 'Node') || returnType === 'RandomListNode' || returnType === 'Node';

  let imports = 'from typing import List, Optional\n\n';
  if (hasRandomNode) {
    imports += `# Definition for a Node.\n# class Node:\n#     def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):\n#         self.val = int(x)\n#         self.next = next\n#         self.random = random\n\n`;
  } else if (hasListNode || hasTreeNode) {
    imports += `# Definition for singly-linked list / binary tree node\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n`;
  }

  const paramList = parameters.map(p => {
    const pyType = TYPE_MAP.python[p.type] || p.type;
    return `${p.name}: ${pyType}`;
  }).join(', ');

  const selfParam = paramList ? `self, ${paramList}` : 'self';
  const returnAnnotation = pyReturnType !== 'void' ? ` -> ${pyReturnType}` : '';

  return `${imports}class Solution:\n    def ${functionName}(${selfParam})${returnAnnotation}:\n        # Write your solution here\n        pass\n`;
}

/**
 * Generate JavaScript Starter Code Boilerplate
 */
export function generateJavaScriptTemplate(fnDef) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};

  let jsDoc = '/**\n';
  parameters.forEach(p => {
    const jsType = TYPE_MAP.javascript[p.type] || p.type;
    jsDoc += ` * @param {${jsType}} ${p.name}\n`;
  });
  const jsRetType = TYPE_MAP.javascript[returnType] || returnType;
  jsDoc += ` * @return {${jsRetType}}\n */\n`;

  const paramList = parameters.map(p => p.name).join(', ');

  return `${jsDoc}var ${functionName} = function(${paramList}) {\n    // Write your solution here\n};\n`;
}

/**
 * Generate C++ Starter Code Boilerplate
 */
export function generateCppTemplate(fnDef) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const cppReturnType = TYPE_MAP.cpp[returnType] || returnType;

  const paramList = parameters.map(p => {
    const cppType = TYPE_MAP.cpp[p.type] || p.type;
    const isReference = cppType.startsWith('vector<');
    return isReference ? `${cppType}& ${p.name}` : `${cppType} ${p.name}`;
  }).join(', ');

  return `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${cppReturnType} ${functionName}(${paramList}) {\n        // Write your solution here\n    }\n};\n`;
}

/**
 * Generate Java Starter Code Boilerplate
 */
export function generateJavaTemplate(fnDef) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const javaReturnType = TYPE_MAP.java[returnType] || returnType;

  const paramList = parameters.map(p => {
    const javaType = TYPE_MAP.java[p.type] || p.type;
    return `${javaType} ${p.name}`;
  }).join(', ');

  return `class Solution {\n    public ${javaReturnType} ${functionName}(${paramList}) {\n        // Write your solution here\n    }\n}\n`;
}

/**
 * Generates starter templates for all 4 supported languages in a single call.
 */
export function generateAllStarterTemplates(fnDef) {
  return {
    python: generatePythonTemplate(fnDef),
    javascript: generateJavaScriptTemplate(fnDef),
    cpp: generateCppTemplate(fnDef),
    java: generateJavaTemplate(fnDef)
  };
}

/**
 * Dispatcher to generate starter code for any requested target language.
 * Flexibly accepts (fnDef, language) OR (language, fnDef).
 */
export function generateStarterCode(arg1, arg2 = 'python') {
  let fnDef = arg1;
  let language = arg2;

  if (typeof arg1 === 'string') {
    language = arg1;
    fnDef = arg2;
  }

  const lang = (language || 'python').toLowerCase();
  switch (lang) {
    case 'javascript':
    case 'js':
      return generateJavaScriptTemplate(fnDef);
    case 'cpp':
    case 'c++':
      return generateCppTemplate(fnDef);
    case 'java':
      return generateJavaTemplate(fnDef);
    case 'python':
    case 'py':
    default:
      return generatePythonTemplate(fnDef);
  }
}
