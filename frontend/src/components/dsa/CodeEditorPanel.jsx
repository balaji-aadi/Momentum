import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useCodingArena } from './CodingArenaContext';
import {
  LuMaximize2,
  LuMinimize2,
  LuRotateCcw
} from 'react-icons/lu';

export function CodeEditorPanel({ isFullscreen, onToggleFullscreen }) {
  const {
    problem,
    language,
    setLanguage,
    code,
    handleCodeChange,
    handleResetCode
  } = useCodingArena();

  const editorRef = useRef(null);

  // Synchronous beforeMount callback: Configures Monaco Monarch Tokenizer & Theme BEFORE Editor DOM mounting
  const handleBeforeMount = (monaco) => {
    // 1. Precise Python Tokenizer overriding Monaco's default rule set
    monaco.languages.setMonarchTokensProvider('python', {
      defaultToken: '',
      tokenPostfix: '.python',

      keywords: [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
        'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
        'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
        'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
      ],

      // Types & Builtins -> Yellow / Sand (#e5c07b)
      builtins: [
        'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable',
        'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir',
        'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format',
        'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex',
        'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
        'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next',
        'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'range',
        'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted',
        'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
        'List', 'Optional', 'Dict', 'Set', 'Tuple'
      ],

      brackets: [
        { open: '{', close: '}', token: 'delimiter.bracket' },
        { open: '[', close: ']', token: 'delimiter.bracket' },
        { open: '(', close: ')', token: 'delimiter.bracket' }
      ],

      tokenizer: {
        root: [
          // Class & Def keywords explicitly matched
          [/def(?=\s+)/, 'custom-keyword'],
          [/class(?=\s+)/, 'custom-keyword'],

          // Function & Class Name Identifiers
          [/def\s+([a-zA-Z_]\w*)/, ['custom-keyword', 'custom-function']],
          [/class\s+([a-zA-Z_]\w*)/, ['custom-keyword', 'custom-class']],

          // Words, Built-ins, and Variables
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                '@keywords': 'custom-keyword',
                '@builtins': 'custom-builtin',
                '@default': 'custom-variable'
              }
            }
          ],

          // Comments -> Dimmed Grey & Italic
          [/#.*$/, 'custom-comment'],

          // Delimiters & Brackets
          [/[{}()\[\]]/, 'custom-bracket'],
          [/[=><!~?:&|+\-*\/%^]+/, 'custom-operator'],
          [/[,:]/, 'custom-delimiter']
        ]
      }
    });

    // 2. Define Theme matching Image 1
    monaco.editor.defineTheme('one-dark-leetcode', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // class, def, for, in, if, return, from, import -> Vibrant Purple (#c678dd)
        { token: 'custom-keyword', foreground: 'c678dd', fontStyle: 'bold' },
        { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
        { token: 'keyword.python', foreground: 'c678dd', fontStyle: 'bold' },

        // Class & Function identifiers -> Sky Blue (#61afef)
        { token: 'custom-class', foreground: '61afef' },
        { token: 'custom-function', foreground: '61afef' },

        // enumerate, int, list, List -> Sand Yellow (#e5c07b)
        { token: 'custom-builtin', foreground: 'e5c07b' },

        // self, nums, target, seen, i, j -> Coral Pink (#e06c75)
        { token: 'custom-variable', foreground: 'e06c75' },

        // Comments -> Dimmed Grey (#5c6370)
        { token: 'custom-comment', foreground: '5c6370', fontStyle: 'italic' },

        // Brackets & Operators -> Single Color Off-White (#abb2bf)
        { token: 'custom-bracket', foreground: 'abb2bf' },
        { token: 'custom-operator', foreground: 'abb2bf' },
        { token: 'custom-delimiter', foreground: 'abb2bf' }
      ],
      colors: {
        'editor.background': '#1e1e24',
        'editor.foreground': '#abb2bf',
        'editorLineNumber.foreground': '#4b5263',
        'editorLineNumber.activeForeground': '#c8ccd4',
        'editor.lineHighlightBackground': '#282c34',
        'editorCursor.foreground': '#c678dd',
        'editor.selectionBackground': '#3e4451'
      }
    });
  };

  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      default: return 'javascript';
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Directly handle Reset action on Monaco Editor instance
  const onResetCode = () => {
    handleResetCode();
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e24] border-b border-[#2d2d38] overflow-hidden select-none">
      {/* Clean Editor Top Toolbar */}
      <div className="h-10 border-b border-[#2d2d38] bg-[#16161c] px-3 flex items-center justify-between shrink-0">
        {/* Left Toolbar: Language Selector */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-slate-200 hover:bg-[#252530] rounded-md px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="python" className="bg-[#1e1e24]">Python3</option>
            <option value="javascript" className="bg-[#1e1e24]">JavaScript</option>
            <option value="cpp" className="bg-[#1e1e24]">C++</option>
            <option value="java" className="bg-[#1e1e24]">Java</option>
          </select>
        </div>

        {/* Right Toolbar Controls: Reset & Fullscreen Only */}
        <div className="flex items-center gap-1">
          <button
            onClick={onResetCode}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-[#252530] transition-colors cursor-pointer"
            title="Reset to default code template"
          >
            <LuRotateCcw size={15} />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-[#252530] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Editor"}
          >
            {isFullscreen ? <LuMinimize2 size={15} /> : <LuMaximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Workspace */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          theme="one-dark-leetcode"
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          onChange={(val) => {
            handleCodeChange(val || '');
          }}
          options={{
            fontSize: 14.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontWeight: '500',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            lineNumbersMinChars: 3,
            lineHeight: 23,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            renderLineHighlight: 'line',
            folding: true,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            wordBasedSuggestions: false,
            padding: { top: 14, bottom: 14 }
          }}
        />
      </div>
    </div>
  );
}
