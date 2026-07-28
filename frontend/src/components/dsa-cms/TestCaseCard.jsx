import React, { useState } from 'react';
import {
  LuCheckSquare,
  LuEye,
  LuEyeOff,
  LuPlus,
  LuTrash2,
  LuCopy,
  LuClock,
  LuCpu,
  LuFileText,
  LuUpload,
  LuDownload,
  LuSparkles,
  LuX,
  LuCheck
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import { DataTypeRegistry } from '../../registries/DataTypeRegistry';

export default function TestCaseCard({ formData, setFormData }) {
  const [activeTab, setActiveTab] = useState('visible'); // 'visible' | 'hidden'
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState('json'); // 'json' | 'delimiter'
  const [bulkText, setBulkText] = useState('');
  const [bulkOutputsText, setBulkOutputsText] = useState('');
  const [importOption, setImportOption] = useState('append'); // 'append' | 'replace'

  const visibleCases = formData.visibleTestCases || [];
  const hiddenCases = formData.hiddenTestCases || [];
  const executionLimits = formData.executionLimits || { timeLimitMs: 2000, memoryLimitMb: 256 };

  const currentCases = activeTab === 'visible' ? visibleCases : hiddenCases;
  const targetField = activeTab === 'visible' ? 'visibleTestCases' : 'hiddenTestCases';

  // Add new single test case
  const handleAddTestCase = () => {
    const newCase = {
      input: '',
      expectedOutput: '',
      explanation: '',
      weight: 1.0,
      isActive: true,
      isPerformanceTest: activeTab === 'hidden'
    };
    setFormData(prev => ({
      ...prev,
      [targetField]: [...(prev[targetField] || []), newCase]
    }));
  };

  // Update test case item
  const handleUpdate = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev[targetField] || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [targetField]: updated };
    });
  };

  // Delete single test case
  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      [targetField]: (prev[targetField] || []).filter((_, i) => i !== index)
    }));
  };

  // Clear all cases in active tab
  const handleClearAll = () => {
    if (!window.confirm(`Are you sure you want to clear ALL ${currentCases.length} ${activeTab} test cases?`)) return;
    setFormData(prev => ({ ...prev, [targetField]: [] }));
    toast.success(`Cleared all ${activeTab} test cases`);
  };

  // Duplicate test case
  const handleDuplicate = (index) => {
    setFormData(prev => {
      const list = [...(prev[targetField] || [])];
      const copy = { ...list[index] };
      list.splice(index + 1, 0, copy);
      return { ...prev, [targetField]: list };
    });
  };

  // Update Execution Limits
  const handleLimitChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      executionLimits: {
        ...(prev.executionLimits || { timeLimitMs: 2000, memoryLimitMb: 256 }),
        [field]: Number(value)
      }
    }));
  };

  // Process Bulk Import
  const handleProcessBulkImport = () => {
    let parsedCases = [];

    if (bulkMode === 'json') {
      try {
        const json = JSON.parse(bulkText);
        if (!Array.isArray(json)) {
          toast.error("JSON must be an array of objects: [{ input, expectedOutput }]");
          return;
        }
        parsedCases = json.map(item => ({
          input: typeof item.input === 'object' ? JSON.stringify(item.input) : String(item.input || ''),
          expectedOutput: typeof item.expectedOutput === 'object' ? JSON.stringify(item.expectedOutput) : String(item.expectedOutput || item.output || ''),
          explanation: item.explanation || '',
          weight: item.weight || 1.0,
          isActive: item.isActive !== false,
          isPerformanceTest: activeTab === 'hidden'
        }));
      } catch (err) {
        toast.error("Invalid JSON syntax. Please check formatting.");
        return;
      }
    } else {
      // Delimiter / Line-by-line mode
      const inputs = bulkText.split('===CASE===').map(s => s.trim()).filter(Boolean);
      const outputs = bulkOutputsText.split('===CASE===').map(s => s.trim()).filter(Boolean);

      if (inputs.length === 0) {
        toast.error("No input test cases found!");
        return;
      }

      parsedCases = inputs.map((inp, idx) => ({
        input: inp,
        expectedOutput: outputs[idx] || '',
        explanation: `Bulk imported test case ${idx + 1}`,
        weight: 1.0,
        isActive: true,
        isPerformanceTest: activeTab === 'hidden'
      }));
    }

    if (parsedCases.length === 0) {
      toast.error("No valid test cases found to import.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      [targetField]: importOption === 'replace'
        ? parsedCases
        : [...(prev[targetField] || []), ...parsedCases]
    }));

    toast.success(`Successfully imported ${parsedCases.length} ${activeTab} test cases!`);
    setShowBulkModal(false);
    setBulkText('');
    setBulkOutputsText('');
  };

  // File Upload JSON Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        setBulkText(content);
        toast.success(`Loaded "${file.name}"! Click "Process Import" to apply.`);
      } catch (err) {
        toast.error("Failed to read file");
      }
    };
    reader.readAsText(file);
  };

  // Export JSON File Handler
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentCases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${formData.slug || 'problem'}_${activeTab}_testcases.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${currentCases.length} ${activeTab} test cases to JSON!`);
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LuCheckSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">Test Cases & Execution Limits</h2>
            <p className="text-xs text-textSub">Sample visible test cases for students and hidden evaluation cases (Supports 200+ Bulk JSON Import).</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textMain dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <LuUpload size={14} className="text-primary" />
            <span>Bulk Import JSON / Text</span>
          </button>

          {currentCases.length > 0 && (
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-textSub hover:text-textMain rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <LuDownload size={14} />
              <span>Export JSON ({currentCases.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddTestCase}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <LuPlus size={15} />
            <span>Add Single Case</span>
          </button>
        </div>
      </div>

      {/* Execution Limits Bar */}
      <div className="bg-bgLight dark:bg-slate-800/60 p-4 rounded-xl border border-borderLight dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuClock className="text-primary" size={14} />
            <span>Time Limit (milliseconds)</span>
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            step="100"
            value={executionLimits.timeLimitMs || 2000}
            onChange={(e) => handleLimitChange('timeLimitMs', e.target.value)}
            className="w-full px-3 py-2 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-textMain dark:text-slate-200 flex items-center gap-1.5">
            <LuCpu className="text-primary" size={14} />
            <span>Memory Limit (Megabytes)</span>
          </label>
          <input
            type="number"
            min="16"
            max="1024"
            step="16"
            value={executionLimits.memoryLimitMb || 256}
            onChange={(e) => handleLimitChange('memoryLimitMb', e.target.value)}
            className="w-full px-3 py-2 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-textMain dark:text-white focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Visible vs Hidden Test Case Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-borderLight dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('visible')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'visible'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-bgLight dark:bg-slate-800 text-textSub hover:text-textMain border border-borderLight dark:border-slate-700'
              }`}
          >
            <LuEye size={15} />
            <span>Visible Sample Cases ({visibleCases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hidden')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'hidden'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-bgLight dark:bg-slate-800 text-textSub hover:text-textMain border border-borderLight dark:border-slate-700'
              }`}
          >
            <LuEyeOff size={15} />
            <span>Hidden Evaluation Cases ({hiddenCases.length})</span>
          </button>
        </div>

        {currentCases.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LuTrash2 size={13} />
            <span>Clear All {activeTab} Cases</span>
          </button>
        )}
      </div>

      {/* Data Structure Format Helper Banner (Shown ONCE at top) */}
      <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
          <LuSparkles size={14} /> Data Structure Format Guidelines:
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div><strong className="text-blue-800 dark:text-blue-200">ListNode:</strong> <code className="bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">[1,2,3,4]</code></div>
          <div><strong className="text-blue-800 dark:text-blue-200">TreeNode:</strong> <code className="bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">[1,null,2,3]</code></div>
          <div><strong className="text-blue-800 dark:text-blue-200">Graph:</strong> <code className="bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">[[2,4],[1,3]]</code></div>
        </div>
      </div>

      {/* Test Cases List */}
      {currentCases.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-borderLight dark:border-slate-800 rounded-xl bg-bgLight dark:bg-slate-800/40 space-y-3">
          <p className="text-xs font-semibold text-textSub">No {activeTab} test cases added yet.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleAddTestCase}
              className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <LuPlus size={14} />
              <span>Add Single Case</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-textMain dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <LuUpload size={14} />
              <span>Bulk Import (100+ Cases)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {currentCases.map((tc, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3 shadow-xs">
              {/* Card Header & Controls */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold">{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeTab === 'visible' ? 'Sample Case' : 'Hidden Case'} #{idx + 1}</span>
                  {tc.isPerformanceTest && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-md border border-amber-500/20">Stress Test</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(idx)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
                    title="Duplicate Case"
                  >
                    <LuCopy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                    title="Delete Case"
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Input & Expected Output Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Parameter Input Builder */}
                <StructuredParamInputBuilder
                  tc={tc}
                  index={idx}
                  parameters={formData.functionDefinition?.parameters || []}
                  onUpdateInput={(i, val) => handleUpdate(i, 'input', val)}
                />

                {/* Expected Output */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-textSub">Expected Output *</label>
                  <textarea
                    rows={4}
                    value={typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput, null, 2) : (tc.expectedOutput || '')}
                    onChange={(e) => {
                      try {
                        handleUpdate(idx, 'expectedOutput', JSON.parse(e.target.value));
                      } catch (err) {
                        handleUpdate(idx, 'expectedOutput', e.target.value);
                      }
                    }}
                    placeholder="e.g. [0, 1] or 3"
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Explanation Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-textSub">Note / Explanation (Optional)</label>
                <input
                  type="text"
                  value={tc.explanation || ''}
                  onChange={(e) => handleUpdate(idx, 'explanation', e.target.value)}
                  placeholder="e.g. Edge case with max array size."
                  className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkModal && (
        <div style={{ marginTop: '0rem' }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-bgLight dark:bg-slate-800/60 border-b border-borderLight dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuUpload className="text-primary" size={18} />
                <h3 className="text-sm font-bold text-textMain dark:text-white">
                  Bulk Import {activeTab === 'visible' ? 'Visible' : 'Hidden'} Test Cases (Supports 100-300+ Cases)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-textSub hover:text-textMain rounded-lg cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Import Mode Switcher */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex bg-bgLight dark:bg-slate-800 p-1 rounded-xl border border-borderLight">
                  <button
                    type="button"
                    onClick={() => setBulkMode('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${bulkMode === 'json' ? 'bg-primary text-white shadow-xs' : 'text-textSub'
                      }`}
                  >
                    JSON Array Mode (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('delimiter')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${bulkMode === 'delimiter' ? 'bg-primary text-white shadow-xs' : 'text-textSub'
                      }`}
                  >
                    Raw Delimited Text Mode
                  </button>
                </div>

                {/* File Upload Button */}
                {bulkMode === 'json' && (
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl border border-borderLight cursor-pointer flex items-center gap-1.5 text-textMain dark:text-white shrink-0">
                    <LuFileText size={14} className="text-primary" />
                    <span>Upload .json File</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Function Signature & Parameter Guide Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800 shadow-2xs font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Entrypoint:</span>
                    <code className="font-mono text-emerald-400 font-bold truncate">
                      {formData.functionDefinition?.functionName || 'solution'}(
                      {(formData.functionDefinition?.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ')}
                      ) -&gt; {formData.functionDefinition?.returnType || 'void'}
                    </code>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 rounded-full shrink-0">
                    {(formData.functionDefinition?.parameters || []).length} {(formData.functionDefinition?.parameters || []).length === 1 ? 'Param' : 'Params'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal">
                  JSON inputs map parameter names directly e.g. <code className="font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">{`{ ${(formData.functionDefinition?.parameters || []).map(p => `"${p.name}": ...`).join(', ') || '"input": ...'} }`}</code>.
                </p>
              </div>

              {/* Import Mode Explanation */}
              {bulkMode === 'json' ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-textMain dark:text-white">
                        Paste JSON Array of Test Cases
                      </h3>
                      <p className="text-[11px] text-textSub font-normal">
                        Supports 100–300+ hidden evaluation test cases.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkText(generateDynamicSampleJsonTemplate(formData.functionDefinition))}
                      className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-primary/20 shadow-2xs"
                    >
                      <LuSparkles size={14} />
                      <span>Load Sample Template</span>
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={generateDynamicSampleJsonTemplate(formData.functionDefinition)}
                    className="w-full p-3 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-textSub">Separate each test case using <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-primary">===CASE===</code> keyword.</p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-textMain dark:text-slate-200">Inputs (Separated by ===CASE===)</label>
                    <textarea
                      rows={5}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`{"${(formData.functionDefinition?.parameters || [])[0]?.name || 'param1'}": [1,2,3]}\n===CASE===\n{"${(formData.functionDefinition?.parameters || [])[0]?.name || 'param1'}": [4,5,6]}`}
                      className="w-full p-3 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-textMain dark:text-slate-200">Expected Outputs (Separated by ===CASE===)</label>
                    <textarea
                      rows={5}
                      value={bulkOutputsText}
                      onChange={(e) => setBulkOutputsText(e.target.value)}
                      placeholder="12&#10;===CASE===&#10;4"
                      className="w-full p-3 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className="flex items-center gap-4 pt-2 border-t border-borderLight dark:border-slate-800 text-xs font-bold text-textMain dark:text-slate-200">
                <span>Import Strategy:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importOpt"
                    value="append"
                    checked={importOption === 'append'}
                    onChange={() => setImportOption('append')}
                    className="accent-primary"
                  />
                  <span>Append to existing ({currentCases.length})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importOpt"
                    value="replace"
                    checked={importOption === 'replace'}
                    onChange={() => setImportOption('replace')}
                    className="accent-primary"
                  />
                  <span>Replace existing cases</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-bgLight dark:bg-slate-800/60 border-t border-borderLight dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-textSub rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessBulkImport}
                disabled={!bulkText.trim()}
                className="px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <LuCheck size={16} />
                <span>Process Import</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StructuredParamInputBuilder({ tc, index, parameters, onUpdateInput }) {
  const [mode, setMode] = useState('structured'); // 'structured' | 'raw'

  // Parse input object
  let parsedObj = {};
  if (typeof tc.input === 'object' && tc.input !== null) {
    parsedObj = tc.input;
  } else if (typeof tc.input === 'string') {
    try {
      parsedObj = JSON.parse(tc.input);
    } catch (e) {
      parsedObj = {};
    }
  }

  const handleParamChange = (paramName, rawVal) => {
    let parsedVal = rawVal;
    try {
      parsedVal = JSON.parse(rawVal);
    } catch (e) {
      parsedVal = rawVal;
    }

    const updatedObj = (typeof parsedObj === 'object' && parsedObj !== null && !Array.isArray(parsedObj))
      ? { ...parsedObj, [paramName]: parsedVal }
      : { [paramName]: parsedVal };

    onUpdateInput(index, updatedObj);
  };

  if (mode === 'raw' || !parameters || parameters.length === 0) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-textSub">Input Data (Raw JSON) *</label>
          {parameters && parameters.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('structured')}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Switch to Parameter Fields
            </button>
          )}
        </div>
        <textarea
          rows={3}
          value={typeof tc.input === 'object' ? JSON.stringify(tc.input, null, 2) : (tc.input || '')}
          onChange={(e) => {
            try {
              onUpdateInput(index, JSON.parse(e.target.value));
            } catch (err) {
              onUpdateInput(index, e.target.value);
            }
          }}
          placeholder='e.g. { "nums": [2,7,11,15], "target": 9 }'
          className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Parameter Input Fields ({parameters.length} params)
        </label>
        <button
          type="button"
          onClick={() => setMode('raw')}
          className="text-[10px] font-bold text-slate-500 hover:text-primary cursor-pointer"
        >
          Edit Raw JSON
        </button>
      </div>

      <div className="space-y-2">
        {parameters.map((param) => {
          const plugin = DataTypeRegistry.get(param.type);
          const val = parsedObj && typeof parsedObj === 'object' && !Array.isArray(parsedObj) && param.name in parsedObj
            ? parsedObj[param.name]
            : (typeof tc.input === 'string' ? tc.input : plugin.defaultVal());

          return (
            <div key={param.name} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="w-36 shrink-0 text-xs font-mono font-bold text-primary">
                {param.name} <span className="text-[10px] font-normal text-slate-500">({plugin.label})</span>
              </span>
              <div className="flex-1">
                {plugin.renderInput({
                  value: val,
                  onChange: (newVal) => handleParamChange(param.name, newVal),
                  placeholder: plugin.placeholder
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateDynamicSampleJsonTemplate(functionDefinition) {
  const parameters = functionDefinition?.parameters || [];
  const functionName = functionDefinition?.functionName || 'solution';
  const returnType = functionDefinition?.returnType || 'number';

  if (parameters.length === 0) {
    return JSON.stringify([
      { input: "[1, 2, 3]", expectedOutput: "6", explanation: "Sample Case 1" },
      { input: "[4, 5]", expectedOutput: "9", explanation: "Sample Case 2" }
    ], null, 2);
  }

  const sampleInput1 = {};
  const sampleInput2 = {};

  parameters.forEach(p => {
    const pName = p.name || 'param';
    const pType = p.type || 'number[]';

    if (pType === 'number') {
      sampleInput1[pName] = pName.toLowerCase().includes('k') ? 3 : 7;
      sampleInput2[pName] = pName.toLowerCase().includes('k') ? 2 : 10;
    } else if (pType === 'string') {
      sampleInput1[pName] = "leetcode";
      sampleInput2[pName] = "sarthi";
    } else if (pType === 'boolean') {
      sampleInput1[pName] = true;
      sampleInput2[pName] = false;
    } else if (pType === 'number[]') {
      sampleInput1[pName] = pName.toLowerCase().includes('card') ? [1, 2, 3, 4, 5, 6, 1] : [2, 7, 11, 15];
      sampleInput2[pName] = pName.toLowerCase().includes('card') ? [2, 2, 2] : [3, 2, 4];
    } else if (pType === 'string[]') {
      sampleInput1[pName] = ["flower", "flow", "flight"];
      sampleInput2[pName] = ["dog", "racecar", "car"];
    } else if (pType === 'number[][]') {
      sampleInput1[pName] = [[1, 3], [2, 6], [8, 10]];
      sampleInput2[pName] = [[1, 4], [4, 5]];
    } else {
      const plugin = DataTypeRegistry.get(pType);
      sampleInput1[pName] = plugin ? plugin.defaultVal() : "[1,2,3]";
      sampleInput2[pName] = plugin ? plugin.defaultVal() : "[4,5,6]";
    }
  });

  let defaultOutput1 = 12;
  let defaultOutput2 = 4;
  if (returnType === 'number[]') {
    defaultOutput1 = [0, 1];
    defaultOutput2 = [1, 2];
  } else if (returnType === 'boolean') {
    defaultOutput1 = true;
    defaultOutput2 = false;
  } else if (returnType === 'string') {
    defaultOutput1 = "fl";
    defaultOutput2 = "";
  }

  const rawJson = JSON.stringify([
    {
      input: sampleInput1,
      expectedOutput: defaultOutput1,
      explanation: `Sample case 1 for ${functionName}`
    },
    {
      input: sampleInput2,
      expectedOutput: defaultOutput2,
      explanation: `Sample case 2 for ${functionName}`
    }
  ], null, 2);

  return rawJson.replace(/\[\s+([\d\s,.-]+)\s+\]/g, (_, inner) => `[${inner.replace(/\s+/g, ' ')}]`);
}
