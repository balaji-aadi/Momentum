import React from 'react';
import { 
  LuSliders, 
  LuCheckCircle2, 
  LuAlertTriangle, 
  LuLayers, 
  LuCpu,
  LuSparkles
} from 'react-icons/lu';

// Parameter-aware parser mapping helper
const TYPE_PARSER_MAP = {
  'number': 'PrimitiveParser',
  'int': 'PrimitiveParser',
  'float': 'PrimitiveParser',
  'string': 'PrimitiveParser',
  'str': 'PrimitiveParser',
  'boolean': 'PrimitiveParser',
  'bool': 'PrimitiveParser',
  'number[]': 'ArrayParser',
  'int[]': 'ArrayParser',
  'float[]': 'ArrayParser',
  'string[]': 'ArrayParser',
  'boolean[]': 'ArrayParser',
  'number[][]': 'MatrixParser',
  'string[][]': 'MatrixParser',
  'boolean[][]': 'MatrixParser',
  'listnode': 'LinkedListParser',
  'randomlistnode': 'RandomListParser',
  'treenode': 'BinaryTreeParser',
  'graph': 'GraphParser'
};

const RETURN_SERIALIZER_MAP = {
  'number': ['PrimitiveSerializer'],
  'string': ['PrimitiveSerializer'],
  'boolean': ['PrimitiveSerializer'],
  'number[]': ['ArraySerializer'],
  'string[]': ['ArraySerializer'],
  'boolean[]': ['ArraySerializer'],
  'number[][]': ['ArraySerializer', 'MatrixSerializer'],
  'string[][]': ['ArraySerializer', 'MatrixSerializer'],
  'listnode': ['LinkedListSerializer'],
  'randomlistnode': ['RandomListSerializer'],
  'treenode': ['BinaryTreeSerializer'],
  'graph': ['ArraySerializer', 'GraphSerializer'],
  'void': ['PrimitiveSerializer', 'ArraySerializer', 'LinkedListSerializer', 'RandomListSerializer', 'BinaryTreeSerializer']
};

const SERIALIZER_COMPARATOR_MAP = {
  'PrimitiveSerializer': ['ExactMatch', 'FloatToleranceMatch'],
  'ArraySerializer': ['ExactMatch', 'OrderedArrayMatch', 'UnorderedArrayMatch'],
  'MatrixSerializer': ['ExactMatch', 'OrderedArrayMatch', 'UnorderedArrayMatch'],
  'LinkedListSerializer': ['LinkedListMatch'],
  'RandomListSerializer': ['RandomListMatch'],
  'BinaryTreeSerializer': ['TreeMatch'],
  'GraphSerializer': ['ExactMatch', 'UnorderedArrayMatch']
};

export function ExecutionProfileCard({ functionDefinition, executionProfile, onChange }) {
  const {
    runtimeType = 'FUNCTION',
    outputSerializer = 'PrimitiveSerializer',
    comparator = 'ExactMatch',
    customType = '',
    inPlaceMutation = false,
    mutatedParameter = ''
  } = executionProfile || {};

  const parameters = functionDefinition?.parameters || [];
  const returnType = (functionDefinition?.returnType || 'void').trim();
  const cleanReturnType = returnType.toLowerCase();

  const handleFieldChange = (field, val) => {
    onChange({
      ...executionProfile,
      [field]: val
    });
  };

  // Compute Compatibility Status
  const allowedSerializers = RETURN_SERIALIZER_MAP[cleanReturnType] || ['PrimitiveSerializer', 'ArraySerializer'];
  const isSerializerCompatible = allowedSerializers.includes(outputSerializer);

  const allowedComparators = SERIALIZER_COMPARATOR_MAP[outputSerializer] || ['ExactMatch'];
  const isComparatorCompatible = allowedComparators.includes(comparator);

  const isFloatMismatch = comparator === 'FloatToleranceMatch' && cleanReturnType !== 'number' && cleanReturnType !== 'float';
  const hasCompatibilityIssue = !isSerializerCompatible || !isComparatorCompatible || isFloatMismatch;

  return (
    <div className="bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <LuSliders size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-textMain dark:text-white tracking-tight">
              Execution Profile &amp; Parser Mapping
            </h2>
            <p className="text-[11px] text-textSub font-medium">
              Parameter-aware input parser routing, output serializer, and comparator strategy.
            </p>
          </div>
        </div>

        {/* Runtime Mode Badge (Strictly FUNCTION in Phase 1) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-[11px] font-bold">
          <LuCpu size={13} />
          <span>Runtime: FUNCTION Mode</span>
        </div>
      </div>

      {/* Parameter-Aware Parser Routing Table (Source of Truth) */}
      <div className="p-3.5 bg-bgLight dark:bg-slate-800/40 rounded-xl border border-borderLight dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-textMain dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <LuLayers size={13} className="text-primary" />
            <span>Parameter-Aware Input Parsers ({parameters.length} params)</span>
          </span>
          <span className="text-[10px] text-textSub font-mono font-semibold">Derived from Function Definition</span>
        </div>

        {parameters.length === 0 ? (
          <p className="text-xs text-textSub italic py-1">No parameters declared in Function Definition yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {parameters.map((p, idx) => {
              const cleanType = (p.type || '').toLowerCase().trim();
              const mappedParser = TYPE_PARSER_MAP[cleanType] || 'PrimitiveParser';
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700/80 text-xs">
                  <div className="overflow-hidden">
                    <span className="font-mono font-bold text-textMain dark:text-white truncate block">{p.name}</span>
                    <span className="text-[10px] font-mono text-textSub">({p.type})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-mono text-[10px] font-bold shrink-0">
                    {mappedParser}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Output Serializer, Comparator, and In-Place Mutation Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Output Serializer */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-textMain dark:text-slate-200">
            Output Serializer
          </label>
          <select
            value={outputSerializer}
            onChange={(e) => handleFieldChange('outputSerializer', e.target.value)}
            className={`w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-surface dark:bg-slate-900 text-textMain dark:text-white focus:outline-none cursor-pointer ${
              !isSerializerCompatible 
                ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10' 
                : 'border-borderLight dark:border-slate-700 focus:border-primary'
            }`}
          >
            <option value="PrimitiveSerializer">PrimitiveSerializer (number, string, bool)</option>
            <option value="ArraySerializer">ArraySerializer (1D array, matrix)</option>
            <option value="MatrixSerializer">MatrixSerializer (2D grid)</option>
            <option value="LinkedListSerializer">LinkedListSerializer (ListNode)</option>
            <option value="RandomListSerializer">RandomListSerializer (RandomListNode)</option>
            <option value="BinaryTreeSerializer">BinaryTreeSerializer (TreeNode)</option>
            <option value="GraphSerializer">GraphSerializer (Graph)</option>
          </select>
          <p className="text-[10px] text-textSub">
            Expected for <code className="text-primary font-mono">{returnType}</code>: {allowedSerializers.join(', ')}
          </p>
        </div>

        {/* Comparator Strategy */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-textMain dark:text-slate-200">
            Comparator Strategy
          </label>
          <select
            value={comparator}
            onChange={(e) => handleFieldChange('comparator', e.target.value)}
            className={`w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-surface dark:bg-slate-900 text-textMain dark:text-white focus:outline-none cursor-pointer ${
              !isComparatorCompatible || isFloatMismatch
                ? 'border-rose-400 focus:border-rose-500 bg-rose-50/10' 
                : 'border-borderLight dark:border-slate-700 focus:border-primary'
            }`}
          >
            <option value="ExactMatch">ExactMatch (Strict Primitive &amp; Direct Match)</option>
            <option value="OrderedArrayMatch">OrderedArrayMatch (Strict Index Order)</option>
            <option value="UnorderedArrayMatch">UnorderedArrayMatch (Any Order / Set Match)</option>
            <option value="LinkedListMatch">LinkedListMatch (Node Traversal)</option>
            <option value="RandomListMatch">RandomListMatch (Random Pointer Isomorphism)</option>
            <option value="TreeMatch">TreeMatch (Binary Tree Structure)</option>
            <option value="FloatToleranceMatch">FloatToleranceMatch (Epsilon 1e-5 for Floats)</option>
          </select>
          <p className="text-[10px] text-textSub">
            Compatible: {allowedComparators.join(', ')}
          </p>
        </div>

        {/* In-Place Mutation Option */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-textMain dark:text-slate-200">
            In-Place Mutation
          </label>
          <div className="p-2 border border-borderLight dark:border-slate-700 rounded-xl bg-surface dark:bg-slate-900 flex items-center justify-between h-[38px]">
            <label className="flex items-center gap-2 text-xs font-bold text-textMain dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inPlaceMutation === true}
                onChange={(e) => handleFieldChange('inPlaceMutation', e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <span>Mutates Input In-Place</span>
            </label>
          </div>
          {inPlaceMutation && (
            <select
              value={mutatedParameter}
              onChange={(e) => handleFieldChange('mutatedParameter', e.target.value)}
              className="w-full mt-1.5 px-3 py-1.5 text-xs font-mono border border-borderLight rounded-lg bg-surface text-textMain focus:outline-none"
            >
              <option value="">-- Select Mutated Parameter --</option>
              {parameters.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Real-Time Cross-Field Compatibility Status Banner */}
      {hasCompatibilityIssue ? (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <LuAlertTriangle size={16} className="shrink-0 text-rose-600" />
          <div>
            <span className="font-bold">Configuration Mismatch: </span>
            {!isSerializerCompatible && (
              <span>Return type <code className="font-mono">{returnType}</code> is incompatible with <code className="font-mono">{outputSerializer}</code>. </span>
            )}
            {!isComparatorCompatible && (
              <span>Comparator <code className="font-mono">{comparator}</code> is incompatible with serializer <code className="font-mono">{outputSerializer}</code>. </span>
            )}
            {isFloatMismatch && (
              <span><code className="font-mono">FloatToleranceMatch</code> requires a float/number return type.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <LuCheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Profile Compatible: Function Definition, Serializer &amp; Comparator are perfectly aligned.</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Validated</span>
        </div>
      )}
    </div>
  );
}
export default ExecutionProfileCard;
