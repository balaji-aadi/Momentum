import React, { useState, useEffect } from 'react';
import axios from '../../services/axiosConfig';
import toast from 'react-hot-toast';
import { ProblemPatternRegistry } from '../../services/judge/ProblemPatternRegistry';
import {
  LuWand as Wand2,
  LuCpu as Cpu,
  LuCheckCircle2 as CheckCircle2,
  LuZap as Zap,
  LuCode2 as Code2,
  LuLayers as Layers,
  LuShieldCheck as ShieldCheck,
  LuPlay as Play,
  LuSave as Save,
  LuRefreshCw as RefreshCw,
  LuSliders as Sliders,
  LuSparkles as Sparkles,
  LuClock as Clock,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuSlidersHorizontal as SlidersHorizontal,
  LuAlertTriangle as AlertTriangle,
  LuXCircle as XCircle
} from 'react-icons/lu';

// Helper to provide standard default constraints based on parameter type
function getDefaultConstraintsForType(paramType = '') {
  const typeStr = (paramType || '').toLowerCase();
  if (typeStr.includes('[][]') || typeStr.includes('matrix') || typeStr.includes('grid')) {
    return { minRows: 3, maxRows: 5, minCols: 3, maxCols: 5, cellMin: 0, cellMax: 1 };
  }
  if (typeStr.includes('[]') || typeStr.includes('array')) {
    return { minN: 5, maxN: 10, minValue: -100, maxValue: 100 };
  }
  if (typeStr.includes('string')) {
    return { minN: 3, maxN: 10, charset: 'alphabetic' };
  }
  if (typeStr.includes('tree') || typeStr.includes('treenode')) {
    return { minNodes: 5, maxNodes: 15, minValue: 1, maxValue: 100 };
  }
  if (typeStr.includes('graph')) {
    return { minV: 5, maxV: 10, minE: 5, maxE: 15 };
  }
  // Integer / number default
  return { minValue: -100, maxValue: 100 };
}

export function ProblemPackageStudio({ problemId, initialFunctionDefinition, formData, setFormData, onPackagePublished }) {
  const patterns = ProblemPatternRegistry.getPatterns();

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Author-Centric Basic Mode State
  const [selectedPatternId, setSelectedPatternId] = useState('two_sum');
  const activePattern = ProblemPatternRegistry.getPatternById(selectedPatternId);

  // SINGLE SOURCE OF TRUTH FOR FUNCTION DEFINITION:
  // Must always be derived directly from formData.functionDefinition or initialFunctionDefinition.
  // Problem Patterns NEVER determine or overwrite parameter names, count, or types.
  const functionDefinition = formData?.functionDefinition || initialFunctionDefinition || activePattern.defaultFunctionDefinition;

  // Dynamic Per-Parameter Constraint State
  const [parameterConstraints, setParameterConstraints] = useState(
    activePattern.defaultTypeConstraints
  );

  // Test Case Counts & Seed
  const [randomCount, setRandomCount] = useState(10);
  const [stressCount, setStressCount] = useState(2);
  const [seed, setSeed] = useState(133742);

  // Reference Code State
  const [referenceLanguage, setReferenceLanguage] = useState('javascript');
  const [referenceCodeByLang, setReferenceCodeByLang] = useState({
    javascript: activePattern.sampleReferenceCode.javascript,
    python: activePattern.sampleReferenceCode.python
  });
  const [referenceCode, setReferenceCode] = useState(activePattern.sampleReferenceCode.javascript);

  // Advanced Overrides State
  const [generatorName, setGeneratorName] = useState(activePattern.generatorName);
  const [validatorRule, setValidatorRule] = useState(activePattern.validatorRule);
  const [comparatorName, setComparatorName] = useState(activePattern.comparatorName);
  const [normalizerName, setNormalizerName] = useState(activePattern.normalizerName || '');
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);

  // Compiled Package, Report & Error State
  const [compiledPackage, setCompiledPackage] = useState(null);
  const [compilationMetrics, setCompilationMetrics] = useState(null);
  const [compileError, setCompileError] = useState(null);

  // When pattern changes, update preset defaults for engine & constraints, BUT DO NOT TOUCH functionDefinition
  useEffect(() => {
    const p = ProblemPatternRegistry.getPatternById(selectedPatternId);
    setGeneratorName(p.generatorName);
    setValidatorRule(p.validatorRule);
    setComparatorName(p.comparatorName);
    setNormalizerName(p.normalizerName || '');
    setRandomCount(p.defaultRandomCount);
    setStressCount(p.defaultStressCount);

    // Apply pattern default constraints without overriding parameters
    setParameterConstraints(prev => ({
      ...p.defaultTypeConstraints,
      ...prev
    }));

    const newLangCodes = {
      javascript: p.sampleReferenceCode.javascript,
      python: p.sampleReferenceCode.python
    };
    setReferenceCodeByLang(newLangCodes);
    setReferenceCode(newLangCodes[referenceLanguage]);
    setCompileError(null);
  }, [selectedPatternId]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setReferenceLanguage(newLang);
    setReferenceCode(referenceCodeByLang[newLang] || '');
  };

  // Handle reference code text change
  const handleCodeChange = (newCode) => {
    setReferenceCode(newCode);
    setReferenceCodeByLang(prev => ({
      ...prev,
      [referenceLanguage]: newCode
    }));
  };

  // Helper to update per-parameter constraints
  const updateParamConstraint = (paramName, key, value) => {
    setParameterConstraints(prev => ({
      ...prev,
      [paramName]: {
        ...(prev[paramName] || getDefaultConstraintsForType()),
        [key]: value
      }
    }));
  };

  const handleCompile = async () => {
    setLoading(true);
    setCompileError(null);
    setCompiledPackage(null);
    setCompilationMetrics(null);

    const startTime = performance.now();
    try {
      // Find primary array/matrix/tree/graph parameter for generatorOptions
      const parameters = functionDefinition?.parameters || [];
      const primaryParam = parameters.find(p => ['array', 'matrix', 'tree', 'graph', 'number[]', 'number[][]'].includes((p.type || '').toLowerCase()))
        || parameters[0];
      const primaryConstraints = parameterConstraints[primaryParam?.name] || getDefaultConstraintsForType(primaryParam?.type);
      const resolvedFuncName = functionDefinition?.functionName || functionDefinition?.name || 'maxScore';
      const normalizedFunctionDefinition = {
        ...functionDefinition,
        name: resolvedFuncName,
        functionName: resolvedFuncName
      };

      const payload = {
        problemId: problemId || `prob_${Date.now()}`,
        title: activePattern.label,
        functionDefinition: normalizedFunctionDefinition,
        generatorName,
        generatorOptions: {
          lengthMin: Number(primaryConstraints.minN || primaryConstraints.minRows || primaryConstraints.minNodes || primaryConstraints.minV || 5),
          lengthMax: Number(primaryConstraints.maxN || primaryConstraints.maxRows || primaryConstraints.maxNodes || primaryConstraints.maxV || 10),
          valueMin: Number(primaryConstraints.minValue || -100),
          valueMax: Number(primaryConstraints.maxValue || 100)
        },
        constraints: {
          rule: validatorRule,
          minN: Number(primaryConstraints.minN || primaryConstraints.minRows || 5),
          maxN: Number(primaryConstraints.maxN || primaryConstraints.maxRows || 10),
          minValue: Number(primaryConstraints.minValue || -100),
          maxValue: Number(primaryConstraints.maxValue || 100),
          parameterConstraints // Complete dynamic per-parameter constraints payload
        },
        referenceLanguage,
        referenceCode,
        comparatorName,
        normalizerName: normalizerName || undefined,
        randomCount: Number(randomCount),
        stressCount: Number(stressCount),
        seed: Number(seed),
        executionProfile: {
          timeLimitMs: Number(timeLimitMs),
          memoryLimitMb: Number(memoryLimitMb)
        }
      };

      const res = await axios.post('/problem/package/compile', payload);
      const endTime = performance.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

      if (res.data?.success) {
        const pkg = res.data.package;
        setCompiledPackage(pkg);

        const randomGenerated = pkg.hiddenTestCases.filter(tc => !tc.isStress).length;
        const stressGenerated = pkg.hiddenTestCases.filter(tc => tc.isStress).length;

        setCompilationMetrics({
          randomGenerated,
          stressGenerated,
          validationPassed: true,
          outputsGenerated: true,
          version: pkg.packageVersion,
          hash: pkg.hashSignature,
          durationSeconds
        });

        // Sync with formData so manual cases + generated package cases are merged in UI & DB
        if (setFormData) {
          const formattedPkgCases = pkg.hiddenTestCases.map(tc => ({
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expectedOutput: typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
            isHidden: true,
            explanation: tc.category || 'Generated Testcase'
          }));

          setFormData(prev => {
            const manualCases = (prev?.hiddenTestCases || []).filter(
              tc => !tc.explanation || (!tc.explanation.includes('Generated') && tc.explanation !== 'Standard' && tc.explanation !== 'WorstCaseTwoSum')
            );
            return {
              ...prev,
              hiddenTestCases: [...manualCases, ...formattedPkgCases],
              packageVersion: pkg.packageVersion,
              packageHash: pkg.hashSignature
            };
          });
        }

        toast.success(`Package compiled successfully in ${durationSeconds}s! Generated ${pkg.hiddenTestCases.length} test cases.`);
      } else {
        const errMsg = res.data?.message || 'Package compilation failed.';
        setCompileError(errMsg);
        toast.error('Package compilation failed. See error report below.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error compiling problem package.';
      setCompileError(errMsg);
      toast.error('Error compiling problem package. See error report below.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!compiledPackage || !problemId) {
      toast.error("Please compile a package and ensure a valid problem ID is active.");
      return;
    }
    setPublishing(true);
    try {
      const res = await axios.post('/problem/package/publish', {
        problemId,
        pkg: compiledPackage
      });
      if (res.data?.success) {
        toast.success(`Published package ${compiledPackage.packageVersion} to MongoDB!`);
        if (onPackagePublished) onPackagePublished(compiledPackage);
      } else {
        toast.error(res.data?.message || 'Failed to publish package.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error publishing package.');
    } finally {
      setPublishing(false);
    }
  };

  const parametersList = functionDefinition?.parameters || [];

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs font-sans space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wand2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">
              Problem Package Studio
            </h2>
            <p className="text-xs text-textSub">
              Author-centric test case generation, dynamic parameter constraints, and reference solution execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Advanced Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isAdvancedMode
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-textSub hover:text-textMain dark:hover:text-white border-borderLight dark:border-slate-700'
              }`}
          >
            <Sliders size={14} />
            <span>{isAdvancedMode ? 'Advanced Mode Active' : 'Advanced Judge Settings'}</span>
            {isAdvancedMode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Basic Mode Configuration Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Problem Pattern Selector (Provides presets only) */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Sparkles size={16} />
            <span>1. Problem Pattern Preset</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-textSub block mb-1">Select Preset Pattern</label>
            <select
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
              className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer font-medium"
            >
              {patterns.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-textSub mt-2 leading-relaxed">
              {activePattern.description}
            </p>
          </div>

          {/* Preset Mapping Card */}
          {!isAdvancedMode && (
            <div className="bg-surface dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="text-textSub dark:text-slate-400 font-medium">Generator:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold">{generatorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSub dark:text-slate-400 font-medium">Validator:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[11px] font-semibold">{validatorRule}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSub dark:text-slate-400 font-medium">Comparator:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold">{comparatorName}</span>
              </div>
              {normalizerName && (
                <div className="flex items-center justify-between">
                  <span className="text-textSub dark:text-slate-400 font-medium">Normalizer:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[11px] font-semibold">{normalizerName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 2: DYNAMIC PARAMETER-DRIVEN CONSTRAINT EDITOR (Derived 100% from Function Definition) */}
        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-sm font-semibold">
              <SlidersHorizontal size={16} />
              <span>2. Parameter Constraints ({parametersList.length} Parameters)</span>
            </div>
            <span className="text-[11px] text-textSub font-mono">
              Fn: <strong className="text-primary font-bold">{functionDefinition?.functionName || functionDefinition?.name || 'solve'}</strong>({parametersList.map(p => p.name).join(', ')})
            </span>
          </div>

          {parametersList.length === 0 ? (
            <div className="p-6 bg-surface dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-textSub">
              No parameters defined in Function Definition. Add parameters in the Function Definition card above.
            </div>
          ) : (
            /* Dynamic Control Cards for Every Parameter in Function Signature */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parametersList.map((param) => {
                const c = parameterConstraints[param.name] || getDefaultConstraintsForType(param.type);
                const typeLabel = (param.type || 'number').toLowerCase();

                return (
                  <div
                    key={param.name}
                    className="bg-surface dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 font-sans"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <span className="font-bold text-xs text-textMain dark:text-white">
                        Parameter: <strong className="text-primary font-mono">{param.name}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold">
                        {param.type}
                      </span>
                    </div>

                    {/* Integer / Number Parameter Controls */}
                    {(typeLabel === 'integer' || typeLabel === 'number' || typeLabel === 'float') && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-textSub block mb-1">Min Value</label>
                            <input
                              type="number"
                              value={c.minValue ?? 1}
                              onChange={(e) => updateParamConstraint(param.name, 'minValue', Number(e.target.value))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-textSub block mb-1">Max Value</label>
                            <input
                              type="number"
                              value={c.maxValue ?? 100000}
                              onChange={(e) => updateParamConstraint(param.name, 'maxValue', Number(e.target.value))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Dependent Parameter Clamping Helper Badge */}
                        {(param.name.toLowerCase() === 'k' || selectedPatternId === 'sliding_window') && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-[10px] text-primary flex items-center gap-1.5 font-sans">
                            <Sparkles size={12} className="shrink-0 text-primary" />
                            <span className='text-sm'>Auto-Clamped: <strong className="font-mono text-sm">1 ≤ {param.name} ≤ array.length</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 1D Array / Vector Parameter Controls */}
                    {(typeLabel === 'array' || typeLabel === 'number[]' || typeLabel === 'string[]') && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Length (N)</label>
                          <input
                            type="number"
                            value={c.minN ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'minN', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Length (N)</label>
                          <input
                            type="number"
                            value={c.maxN ?? 10}
                            onChange={(e) => updateParamConstraint(param.name, 'maxN', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Element Min</label>
                          <input
                            type="number"
                            value={c.minValue ?? -100}
                            onChange={(e) => updateParamConstraint(param.name, 'minValue', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Element Max</label>
                          <input
                            type="number"
                            value={c.maxValue ?? 100}
                            onChange={(e) => updateParamConstraint(param.name, 'maxValue', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* String Parameter Controls */}
                    {typeLabel === 'string' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Length</label>
                          <input
                            type="number"
                            value={c.minN ?? 3}
                            onChange={(e) => updateParamConstraint(param.name, 'minN', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Length</label>
                          <input
                            type="number"
                            value={c.maxN ?? 10}
                            onChange={(e) => updateParamConstraint(param.name, 'maxN', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Allowed Charset</label>
                          <select
                            value={c.charset || 'alphabetic'}
                            onChange={(e) => updateParamConstraint(param.name, 'charset', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="alphabetic">Alphabetic (a-z, A-Z)</option>
                            <option value="lowercase">Lowercase Only (a-z)</option>
                            <option value="uppercase">Uppercase Only (A-Z)</option>
                            <option value="numeric">Numeric Digits (0-9)</option>
                            <option value="alphanumeric">Alphanumeric (a-Z, 0-9)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 2D Matrix Parameter Controls */}
                    {(typeLabel === 'matrix' || typeLabel === 'grid' || typeLabel === 'number[][]') && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Rows (M)</label>
                          <input
                            type="number"
                            value={c.minRows ?? 3}
                            onChange={(e) => updateParamConstraint(param.name, 'minRows', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Rows (M)</label>
                          <input
                            type="number"
                            value={c.maxRows ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'maxRows', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Cols (N)</label>
                          <input
                            type="number"
                            value={c.minCols ?? 3}
                            onChange={(e) => updateParamConstraint(param.name, 'minCols', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Cols (N)</label>
                          <input
                            type="number"
                            value={c.maxCols ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'maxCols', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Binary Tree Parameter Controls */}
                    {(typeLabel === 'tree' || typeLabel === 'treenode') && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Nodes</label>
                          <input
                            type="number"
                            value={c.minNodes ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'minNodes', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Nodes</label>
                          <input
                            type="number"
                            value={c.maxNodes ?? 15}
                            onChange={(e) => updateParamConstraint(param.name, 'maxNodes', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Node Value Min</label>
                          <input
                            type="number"
                            value={c.minValue ?? 1}
                            onChange={(e) => updateParamConstraint(param.name, 'minValue', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Node Value Max</label>
                          <input
                            type="number"
                            value={c.maxValue ?? 100}
                            onChange={(e) => updateParamConstraint(param.name, 'maxValue', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Graph Parameter Controls */}
                    {typeLabel === 'graph' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Vertices (V)</label>
                          <input
                            type="number"
                            value={c.minV ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'minV', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Vertices (V)</label>
                          <input
                            type="number"
                            value={c.maxV ?? 10}
                            onChange={(e) => updateParamConstraint(param.name, 'maxV', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Min Edges (E)</label>
                          <input
                            type="number"
                            value={c.minE ?? 5}
                            onChange={(e) => updateParamConstraint(param.name, 'minE', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-textSub block mb-1">Max Edges (E)</label>
                          <input
                            type="number"
                            value={c.maxE ?? 15}
                            onChange={(e) => updateParamConstraint(param.name, 'maxE', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Test Case Generation Counts Panel */}
      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3 font-sans">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <Layers size={16} />
          <span>3. Test Case Generation & PRNG Control</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-textSub block mb-1">Random Cases</label>
            <input
              type="number"
              value={randomCount}
              onChange={(e) => setRandomCount(e.target.value)}
              className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-textSub block mb-1">Stress Cases</label>
            <input
              type="number"
              value={stressCount}
              onChange={(e) => setStressCount(e.target.value)}
              className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-textSub block mb-1">PRNG Seed (Optional)</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Advanced Mode Overrides Panel with Structured Select Dropdowns */}
      {isAdvancedMode && (
        <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-4 font-sans animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sliders size={14} />
            <span>Advanced Judge Engine Low-Level Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Structured Select 1: Generator Plugin */}
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Generator Plugin</label>
              <select
                value={generatorName}
                onChange={(e) => setGeneratorName(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-2 text-xs font-mono focus:border-primary outline-none cursor-pointer"
              >
                <option value="UniquePairGeneratorPlugin">UniquePairGeneratorPlugin (Two Sum)</option>
                <option value="RandomArrayPlugin">RandomArrayPlugin (Arrays)</option>
                <option value="SortedArrayPlugin">SortedArrayPlugin (Binary Search)</option>
                <option value="DistinctArrayPlugin">DistinctArrayPlugin (Unique Array)</option>
                <option value="IntervalGeneratorPlugin">IntervalGeneratorPlugin (Intervals)</option>
                <option value="PrefixSumPlugin">PrefixSumPlugin (Prefix Sum)</option>
                <option value="SlidingWindowPlugin">SlidingWindowPlugin (Window k)</option>
                <option value="BSTGeneratorPlugin">BSTGeneratorPlugin (BST Tree)</option>
                <option value="BalancedTreePlugin">BalancedTreePlugin (Balanced Tree)</option>
                <option value="SkewedTreePlugin">SkewedTreePlugin (Skewed Tree)</option>
                <option value="ConnectedGraphPlugin">ConnectedGraphPlugin (Connected Graph)</option>
                <option value="DAGPlugin">DAGPlugin (Acyclic Graph)</option>
                <option value="CyclicLinkedListPlugin">CyclicLinkedListPlugin (Cyclic List)</option>
                <option value="ArrayPrimitive">ArrayPrimitive (1D/2D Primitive)</option>
                <option value="StringPrimitive">StringPrimitive (String Primitive)</option>
                <option value="MatrixPrimitive">MatrixPrimitive (Grid Primitive)</option>
                <option value="LinkedListPrimitive">LinkedListPrimitive (List Primitive)</option>
                <option value="TreePrimitive">TreePrimitive (Tree Primitive)</option>
                <option value="GraphPrimitive">GraphPrimitive (Graph Primitive)</option>
              </select>
            </div>

            {/* Structured Select 2: Validator Rule */}
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Validator Rule</label>
              <select
                value={validatorRule}
                onChange={(e) => setValidatorRule(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-2 text-xs font-mono focus:border-primary outline-none cursor-pointer"
              >
                <option value="twoSum">twoSum (Valid target pair)</option>
                <option value="bst">bst (Left &lt; Node &lt; Right)</option>
                <option value="dag">dag (Topological u &lt; v)</option>
                <option value="connectedGraph">connectedGraph (100% Reachability)</option>
                <option value="range">range (Min/Max range bounds)</option>
                <option value="custom">custom (Custom JS function)</option>
              </select>
            </div>

            {/* Structured Select 3: Comparator Engine */}
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Comparator Engine</label>
              <select
                value={comparatorName}
                onChange={(e) => setComparatorName(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-2 text-xs font-mono focus:border-primary outline-none cursor-pointer"
              >
                <option value="ExactMatch">ExactMatch (Strict equality)</option>
                <option value="OrderedArrayMatch">OrderedArrayMatch (Exact order)</option>
                <option value="UnorderedArrayMatch">UnorderedArrayMatch (Ignore 1D order)</option>
                <option value="UnorderedNestedArrayMatch">UnorderedNestedArrayMatch (Combinations/Subsets)</option>
                <option value="FloatToleranceMatch">FloatToleranceMatch (Epsilon 1e-5)</option>
                <option value="LinkedListMatch">LinkedListMatch (List equality)</option>
                <option value="TreeMatch">TreeMatch (Tree structure)</option>
              </select>
            </div>

            {/* Structured Select 4: Output Normalizer */}
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Output Normalizer</label>
              <select
                value={normalizerName}
                onChange={(e) => setNormalizerName(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-2 text-xs font-mono focus:border-primary outline-none cursor-pointer"
              >
                <option value="">None (Raw output)</option>
                <option value="SortInnerLists">SortInnerLists (Combination sorting)</option>
                <option value="TruncateFloat">TruncateFloat (Precision rounding)</option>
                <option value="CanonicalizeTree">CanonicalizeTree (Trim nulls)</option>
                <option value="CanonicalizeGraph">CanonicalizeGraph (Sort adjacency)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Time Limit (ms)</label>
              <input
                type="number"
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-1.5 font-mono outline-none"
              />
            </div>
            <div>
              <label className="text-textSub dark:text-slate-400 font-semibold block mb-1">Memory Limit (MB)</label>
              <input
                type="number"
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-2.5 py-1.5 font-mono outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reference Solution Code Editor Section */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-semibold">
            <Code2 size={16} />
            <span>4. Author Reference Solution (Auto-Computes Expected Outputs)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-textSub font-medium">Language:</span>
            <select
              value={referenceLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-textMain dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-primary outline-none cursor-pointer"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3 (Python3)</option>
            </select>
          </div>
        </div>

        <textarea
          rows={7}
          value={referenceCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
          placeholder="Write canonical reference solution code here..."
        />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleCompile}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-40"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          <span>{loading ? 'Compiling Package...' : 'Compile Package'}</span>
        </button>

        {compiledPackage && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-40"
          >
            {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{publishing ? 'Publishing Package...' : 'Publish Problem Package'}</span>
          </button>
        )}
      </div>

      {/* COMPILATION ERROR REPORT CARD */}
      {compileError && (
        <div className="bg-rose-500/5 dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-500/40 space-y-3 font-sans animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <span>Problem Package Compilation Failed</span>
            </div>
            <button
              type="button"
              onClick={() => setCompileError(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle size={16} />
            </button>
          </div>

          <p className="text-xs text-textSub font-medium">
            The reference solution code or driver harness encountered an error during execution:
          </p>

          <pre className="bg-slate-900 border border-slate-800 text-rose-300 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {compileError}
          </pre>

          <div className="text-[11px] text-textSub bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <strong className="text-textMain dark:text-white block font-semibold">Troubleshooting Tips:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Ensure your Python solution defines a class named <code className="text-amber-300 font-mono">Solution</code> or top-level function <code className="text-amber-300 font-mono">{functionDefinition?.functionName || functionDefinition?.name || 'solve'}</code>.</li>
              <li>Verify that variable and function parameter names match <code className="text-cyan-300 font-mono">({parametersList.map(p => p.name).join(', ')})</code>.</li>
              <li>Check for syntax or logic errors in your reference code.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Compilation Report Summary Card */}
      {compilationMetrics && (
        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Compilation Report Summary</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-textSub font-mono">
              <Clock size={14} className="text-primary" />
              <span>Compilation Time: <strong className="text-textMain dark:text-white">{compilationMetrics.durationSeconds}s</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-surface dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              <span>Random Cases: <strong className="text-textMain dark:text-white">{compilationMetrics.randomGenerated}</strong></span>
            </div>
            <div className="bg-surface dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Check size={14} className="text-amber-500" />
              <span>Stress Cases: <strong className="text-textMain dark:text-white">{compilationMetrics.stressGenerated}</strong></span>
            </div>
            <div className="bg-surface dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              <span>Validation: <strong className="text-emerald-500">Passed</strong></span>
            </div>
            <div className="bg-surface dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              <span>Outputs: <strong className="text-emerald-500">Generated</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-textSub font-mono pt-1">
            <span>Package Version: <strong className="text-emerald-600 dark:text-emerald-400">{compilationMetrics.version}</strong></span>
            <span className="truncate max-w-[320px]">Checksum (SHA256): <strong className="text-primary">{compilationMetrics.hash}</strong></span>
          </div>
        </div>
      )}

      {/* Rich Test Cases Preview Panel */}
      {compiledPackage && (
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textMain dark:text-white flex items-center gap-2">
              <Cpu size={16} className="text-cyan-500" />
              <span>Test Case Preview ({compiledPackage.hiddenTestCases.length})</span>
            </h3>
            <span className="text-xs text-textSub">Inspecting compiled hidden test cases before publishing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {compiledPackage.hiddenTestCases.map((tc, idx) => {
              const inputObj = tc.input || {};
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${tc.isStress
                    ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'
                    : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-textMain dark:text-white">
                      {tc.isStress ? `Stress Case #${tc.testCaseIndex}` : `Random Case #${tc.testCaseIndex}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold flex items-center gap-1">
                        <Check size={12} /> Passed
                      </span>
                      {tc.isStress && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold flex items-center gap-1">
                          <Zap size={12} /> {tc.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formatted Parameter Inputs */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-textSub font-sans font-bold block uppercase tracking-wider">Input Arguments</span>
                    {typeof inputObj === 'object' && inputObj !== null ? (
                      Object.keys(inputObj).map((key) => (
                        <div key={key} className="text-cyan-600 dark:text-cyan-300 truncate">
                          <span className="text-textSub dark:text-slate-400">{key} = </span>
                          <span>{JSON.stringify(inputObj[key])}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-cyan-600 dark:text-cyan-300 break-all">{JSON.stringify(inputObj)}</div>
                    )}
                  </div>

                  {/* Expected Output */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-textSub font-sans font-bold block uppercase tracking-wider">Expected Output</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold break-all">{JSON.stringify(tc.expectedOutput)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
