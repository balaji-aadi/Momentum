import React from 'react';
import { LuCode2, LuPlus, LuTrash2, LuInfo } from 'react-icons/lu';

export function FunctionDefinitionCard({ functionDefinition, onChange }) {
  const {
    functionName = 'twoSum',
    parameters = [],
    returnType = 'number[]'
  } = functionDefinition || {};

  const handleNameChange = (e) => {
    onChange({
      ...functionDefinition,
      functionName: e.target.value
    });
  };

  const handleReturnTypeChange = (e) => {
    onChange({
      ...functionDefinition,
      returnType: e.target.value
    });
  };

  const handleAddParam = () => {
    const updated = [
      ...parameters,
      {
        name: `param${parameters.length + 1}`,
        type: 'number[]',
        required: true,
        nullable: false,
        description: ''
      }
    ];
    onChange({
      ...functionDefinition,
      parameters: updated
    });
  };

  const handleUpdateParam = (index, field, value) => {
    const updated = [...parameters];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange({
      ...functionDefinition,
      parameters: updated
    });
  };

  const handleDeleteParam = (index) => {
    const updated = parameters.filter((_, i) => i !== index);
    onChange({
      ...functionDefinition,
      parameters: updated
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <LuCode2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Function Definition
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Define the entrypoint function name, input parameters, and return type.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Function Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Function Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={functionName}
            onChange={handleNameChange}
            placeholder="e.g. twoSum, maxSubArray, maxScore"
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-mono bg-slate-50/50 text-slate-900 shadow-2xs"
          />
        </div>

        {/* Return Type Dropdown (Request 4) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Return Type <span className="text-primary">*</span>
          </label>
          <select
            value={returnType}
            onChange={handleReturnTypeChange}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-mono bg-slate-50/50 text-slate-900 shadow-2xs cursor-pointer font-semibold"
          >
            <option value="number">number (int / float)</option>
            <option value="string">string (Text)</option>
            <option value="boolean">boolean (true / false)</option>
            <option value="number[]">number[] (1D Array)</option>
            <option value="string[]">string[] (String Array)</option>
            <option value="number[][]">number[][] (2D Matrix / Grid)</option>
            <option value="string[][]">string[][] (2D String Matrix)</option>
            <option value="ListNode">ListNode (Linked List Head)</option>
            <option value="TreeNode">TreeNode (Binary Tree Root)</option>
            <option value="void">void (No Return Value)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Parameters Table (Requests 1 & 2 UI Fix) */}
      <div className="space-y-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Parameters Schema</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded-full">
                {parameters.length} {parameters.length === 1 ? 'param' : 'params'}
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddParam}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <LuPlus size={14} />
            <span>Add Parameter</span>
          </button>
        </div>

        {parameters.length === 0 ? (
          <div className="p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
            No input parameters defined yet. Click "+ Add Parameter" above to define function inputs.
          </div>
        ) : (
          <div className="space-y-3">
            {parameters.map((param, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3 shadow-2xs"
              >
                {/* Row 1: Parameter Name, Data Type & Delete */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Param Name */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Parameter Name</label>
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleUpdateParam(index, 'name', e.target.value)}
                      placeholder="e.g. cardPoints, k, target"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-primary shadow-2xs"
                    />
                  </div>

                  {/* Param Data Type */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Data Type</label>
                    <select
                      value={param.type}
                      onChange={(e) => handleUpdateParam(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-primary cursor-pointer font-semibold shadow-2xs"
                    >
                      <option value="number">number (int/float)</option>
                      <option value="string">string</option>
                      <option value="boolean">boolean</option>
                      <option value="number[]">number[] (1D Array)</option>
                      <option value="string[]">string[] (String Array)</option>
                      <option value="number[][]">number[][] (2D Matrix)</option>
                      <option value="ListNode">ListNode (Linked List)</option>
                      <option value="TreeNode">TreeNode (Binary Tree)</option>
                    </select>
                  </div>

                  {/* Delete Icon */}
                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleDeleteParam(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Parameter"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Checkboxes (Required / Nullable) & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1 border-t border-slate-200/60">
                  {/* Flags */}
                  <div className="sm:col-span-4 flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={param.required !== false}
                        onChange={(e) => handleUpdateParam(index, 'required', e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>Required</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={param.nullable === true}
                        onChange={(e) => handleUpdateParam(index, 'nullable', e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>Nullable</span>
                    </label>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={param.description || ''}
                      onChange={(e) => handleUpdateParam(index, 'description', e.target.value)}
                      placeholder="Description (e.g. Array of card points)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-primary placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
