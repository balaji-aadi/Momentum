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
    TreeNode: 'Optional[TreeNode]'
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
    TreeNode: 'TreeNode'
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
    TreeNode: 'TreeNode*'
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
    TreeNode: 'TreeNode'
  }
};

/**
 * Generate Python Starter Code Boilerplate
 */
export function generatePythonTemplate(fnDef) {
  const { functionName = 'solution', parameters = [], returnType = 'void' } = fnDef || {};
  const pyReturnType = TYPE_MAP.python[returnType] || returnType;

  const hasStructs = parameters.some(p => p.type === 'ListNode' || p.type === 'TreeNode') || returnType === 'ListNode' || returnType === 'TreeNode';

  let imports = 'from typing import List, Optional\n\n';
  if (hasStructs) {
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
    // Pass vectors by reference
    if (cppType.startsWith('vector<')) {
      return `${cppType}& ${p.name}`;
    }
    return `${cppType} ${p.name}`;
  }).join(', ');

  return `#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${cppReturnType} ${functionName}(${paramList}) {\n        // Write your solution here\n    }\n};\n`;
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

  return `import java.util.*;\n\nclass Solution {\n    public ${javaReturnType} ${functionName}(${paramList}) {\n        // Write your solution here\n    }\n}\n`;
}

/**
 * Main Template Generator Entrypoint
 */
export function generateStarterCode(language, functionDefinition) {
  const cleanLang = (language || '').toLowerCase().trim();
  switch (cleanLang) {
    case 'python':
    case 'python3':
    case 'py':
      return generatePythonTemplate(functionDefinition);
    case 'javascript':
    case 'js':
      return generateJavaScriptTemplate(functionDefinition);
    case 'cpp':
    case 'c++':
      return generateCppTemplate(functionDefinition);
    case 'java':
      return generateJavaTemplate(functionDefinition);
    default:
      return generatePythonTemplate(functionDefinition);
  }
}

/**
 * Generate All Starter Code Templates for a Problem
 */
export function generateAllStarterTemplates(functionDefinition) {
  return [
    {
      language: 'python',
      code: generatePythonTemplate(functionDefinition),
      functionSignature: `${functionDefinition.functionName}(self, ...)`
    },
    {
      language: 'javascript',
      code: generateJavaScriptTemplate(functionDefinition),
      functionSignature: `${functionDefinition.functionName}(...)`
    },
    {
      language: 'cpp',
      code: generateCppTemplate(functionDefinition),
      functionSignature: `${functionDefinition.functionName}(...)`
    },
    {
      language: 'java',
      code: generateJavaTemplate(functionDefinition),
      functionSignature: `${functionDefinition.functionName}(...)`
    }
  ];
}
