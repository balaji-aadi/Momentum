import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  LuCode2, 
  LuTerminal, 
  LuFileCode, 
  LuSparkles 
} from 'react-icons/lu';
import { ProblemApi } from '../../services/api/Problem.api';
import { generateStarterCode, generateAllStarterTemplates } from '../../utils/templateGenerator';
import toast from 'react-hot-toast';

export default function StarterCodeTabs({ formData, setFormData }) {
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [activeLangCode, setActiveLangCode] = useState('python');
  const [loadingLangs, setLoadingLangs] = useState(true);

  // Define custom LeetCode Dark Theme in Monaco
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#1a1a1a', 
        'editor.foreground': '#cccccc',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorLineNumber.foreground': '#555555',
        'editorLineNumber.activeForeground': '#ffffff',
        'editorIndentGuide.background': '#2d2d2d',
        'editorIndentGuide.activeBackground': '#404040',
        'editor.selectionBackground': '#264f78',
      }
    });
  };

  // Load languages dynamically from MongoDB (Filtering out 'go')
  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLangs(true);
      try {
        const res = await ProblemApi.getLanguages();
        if (res.data?.success) {
          // Filter out 'go' language as explicitly requested by user
          const langs = (res.data.data || []).filter(l => l.code !== 'go');
          setAvailableLanguages(langs);
          if (langs.length > 0) {
            const hasActive = langs.some(l => l.code === activeLangCode);
            if (!hasActive) setActiveLangCode(langs[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to fetch supported languages", err);
      } finally {
        setLoadingLangs(false);
      }
    };
    fetchLanguages();
  }, []);

  const starterCodeList = formData.starterCode || [];

  // Get current active language item from formData.starterCode
  const activeCodeObj = starterCodeList.find(s => s.language === activeLangCode) || {
    language: activeLangCode,
    code: '',
    functionSignature: '',
    defaultTemplate: ''
  };

  // Find language info from DB list
  const activeLangMeta = availableLanguages.find(l => l.code === activeLangCode) || {
    name: activeLangCode.toUpperCase(),
    monacoId: activeLangCode === 'cpp' ? 'cpp' : activeLangCode,
    defaultTemplate: ''
  };

  // Update starter code for active language
  const handleUpdateCode = (field, value) => {
    setFormData(prev => {
      const list = [...(prev.starterCode || [])];
      const idx = list.findIndex(s => s.language === activeLangCode);

      const updatedObj = {
        ...(idx >= 0 ? list[idx] : { language: activeLangCode, code: '', functionSignature: '', defaultTemplate: '' }),
        [field]: value
      };

      if (idx >= 0) {
        list[idx] = updatedObj;
      } else {
        list.push(updatedObj);
      }

      return { ...prev, starterCode: list };
    });
  };

  // Auto-generate template for active language from Function Definition
  const handleResetToDefault = () => {
    const fnDef = formData.functionDefinition || { functionName: 'twoSum', parameters: [], returnType: 'void' };
    const generated = generateStarterCode(activeLangCode, fnDef);
    handleUpdateCode('code', generated);
    toast.success(`Generated ${activeLangMeta.name} template from Function Definition!`);
  };

  // Auto-generate starter templates for ALL supported languages at once
  const handleGenerateAllTemplates = () => {
    const fnDef = formData.functionDefinition || { functionName: 'twoSum', parameters: [], returnType: 'void' };
    const allTemplates = generateAllStarterTemplates(fnDef);
    setFormData(prev => ({
      ...prev,
      starterCode: allTemplates
    }));
    toast.success("Generated templates for Python, JavaScript, C++, and Java!");
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LuCode2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">Starter Code (LeetCode Theme Monaco Editor)</h2>
            <p className="text-xs text-textSub">Configure initial solution boilerplates for students across Python, JavaScript, C++, and Java.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAllTemplates}
            className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
            title="Auto-generate templates for all languages from Function Definition"
          >
            <LuSparkles size={14} className="text-primary" />
            <span>Auto-Generate All Templates</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textMain dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Generate template for current language"
          >
            <span>Reset Active Tab</span>
          </button>
        </div>
      </div>

      {/* Language Tabs (Go excluded) */}
      {loadingLangs ? (
        <div className="p-4 text-center text-textSub text-xs font-semibold animate-pulse">
          Loading execution languages from database...
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-borderLight dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
          {availableLanguages.map((lang) => {
            const hasCode = starterCodeList.some(s => s.language === lang.code && s.code.trim().length > 0);
            const isActive = activeLangCode === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLangCode(lang.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm'
                    : 'bg-bgLight dark:bg-slate-800 text-textSub hover:text-textMain border border-borderLight dark:border-slate-700'
                }`}
              >
                <LuTerminal size={14} className={isActive ? "text-primary" : ""} />
                <span>{lang.name}</span>
                {hasCode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Function Signature Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
          <LuFileCode className="text-primary" size={14} />
          <span>Function Signature ({activeLangMeta.name})</span>
        </label>
        <input
          type="text"
          value={activeCodeObj.functionSignature || (formData.functionDefinition?.functionName ? `${formData.functionDefinition.functionName}(...)` : 'twoSum(...)')}
          onChange={(e) => handleUpdateCode('functionSignature', e.target.value)}
          placeholder={`e.g. ${activeLangCode === 'python' ? 'twoSum(self, nums: List[int], target: int) -> List[int]' : 'twoSum(nums, target)'}`}
          className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#282828] rounded-xl font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* LeetCode Dark Theme Monaco Code Editor */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-textMain dark:text-slate-200">
          <span>Starter Code Boilerplate ({activeLangMeta.name})</span>
          <span className="text-[11px] font-mono text-textSub font-normal">Theme: leetcode-dark</span>
        </div>

        <div className="rounded-xl overflow-hidden border border-[#282828] shadow-sm bg-[#1a1a1a]">
          <Editor
            height="280px"
            beforeMount={handleEditorWillMount}
            theme="leetcode-dark"
            language={activeLangMeta.monacoId === 'cpp' ? 'cpp' : activeLangMeta.monacoId || 'javascript'}
            value={activeCodeObj.code || ''}
            onChange={(val) => handleUpdateCode('code', val || '')}
            options={{
              fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
              fontSize: 14,
              lineHeight: 22,
              fontWeight: '400',
              padding: { top: 12, bottom: 12 },
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              cursorStyle: 'line',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: true
            }}
          />
        </div>
      </div>
    </div>
  );
}
