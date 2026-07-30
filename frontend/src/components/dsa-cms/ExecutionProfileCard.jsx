import React from 'react';
import { LuSliders } from 'react-icons/lu';

export function ExecutionProfileCard({ executionProfile, onChange }) {
  const {
    runtimeType = 'FUNCTION',
    inputParser = 'ArrayParser',
    outputSerializer = 'ArraySerializer',
    comparator = 'ExactMatch'
  } = executionProfile || {};

  const handleFieldChange = (field, val) => {
    onChange({
      ...executionProfile,
      [field]: val
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <LuSliders size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Execution Profile
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Configure execution mode, input parser, output serializer, and comparison strategy.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Runtime Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Runtime Type
          </label>
          <select
            value={runtimeType}
            onChange={(e) => handleFieldChange('runtimeType', e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="FUNCTION">FUNCTION (Function Call Signature)</option>
            <option value="CONSOLE_INPUT">CONSOLE_INPUT (Standard Input / std::cin)</option>
          </select>
        </div>

        {/* Input Parser */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Input Parser Registry
          </label>
          <select
            value={inputParser}
            onChange={(e) => handleFieldChange('inputParser', e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="PrimitiveParser">PrimitiveParser (Number/String/Bool)</option>
            <option value="ArrayParser">ArrayParser (1D Array)</option>
            <option value="MatrixParser">MatrixParser (2D Grid)</option>
            <option value="LinkedListParser">LinkedListParser (ListNode)</option>
            <option value="RandomListParser">RandomListParser (RandomListNode)</option>
            <option value="BinaryTreeParser">BinaryTreeParser (TreeNode)</option>
            <option value="GraphParser">GraphParser (Adjacency Graph)</option>
          </select>
        </div>

        {/* Output Serializer */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Output Serializer Registry
          </label>
          <select
            value={outputSerializer}
            onChange={(e) => handleFieldChange('outputSerializer', e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="PrimitiveSerializer">PrimitiveSerializer</option>
            <option value="ArraySerializer">ArraySerializer</option>
            <option value="LinkedListSerializer">LinkedListSerializer</option>
            <option value="RandomListSerializer">RandomListSerializer</option>
            <option value="BinaryTreeSerializer">BinaryTreeSerializer</option>
          </select>
        </div>

        {/* Comparator */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Comparator Strategy
          </label>
          <select
            value={comparator}
            onChange={(e) => handleFieldChange('comparator', e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ExactMatch">ExactMatch (Strict Primitive)</option>
            <option value="OrderedArrayMatch">OrderedArrayMatch (Strict Index)</option>
            <option value="UnorderedArrayMatch">UnorderedArrayMatch (Any Order)</option>
            <option value="LinkedListMatch">LinkedListMatch (Node Traversal)</option>
            <option value="RandomListMatch">RandomListMatch (Random Pointer Isomorphism)</option>
            <option value="TreeMatch">TreeMatch (Tree Structure)</option>
            <option value="FloatToleranceMatch">FloatToleranceMatch (Epsilon 1e-5)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
