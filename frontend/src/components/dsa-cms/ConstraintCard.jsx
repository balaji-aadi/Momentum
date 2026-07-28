import React from 'react';
import { 
  LuAlertTriangle, 
  LuPlus, 
  LuTrash2, 
  LuZap 
} from 'react-icons/lu';

export default function ConstraintCard({ formData, setFormData }) {
  const constraints = formData.constraints || [];

  // Add constraint
  const handleAddConstraint = (text = '') => {
    setFormData(prev => ({
      ...prev,
      constraints: [...(prev.constraints || []), text]
    }));
  };

  // Update constraint text
  const handleUpdate = (index, value) => {
    setFormData(prev => {
      const updated = [...(prev.constraints || [])];
      updated[index] = value;
      return { ...prev, constraints: updated };
    });
  };

  // Delete constraint
  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      constraints: (prev.constraints || []).filter((_, i) => i !== index)
    }));
  };

  // Quick preset templates
  const presets = [
    '1 <= fruits.length <= 10^5',
    '0 <= fruits[i] < fruits.length',
    '1 <= nums.length <= 2 * 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'Expected Time Complexity: O(N)',
    'Expected Auxiliary Space: O(1)'
  ];

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <LuAlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">Constraints ({constraints.length})</h2>
            <p className="text-xs text-textSub">Bounds on input sizes, element values, and time/space complexity expectations.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAddConstraint('')}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <LuPlus size={15} />
          <span>Add Constraint</span>
        </button>
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-textSub flex items-center gap-1">
          <LuZap size={12} className="text-amber-500" />
          <span>Quick Presets (Click to Add)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => handleAddConstraint(preset)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-bgLight hover:bg-amber-50 text-textSub hover:text-amber-600 border border-borderLight dark:border-slate-700 transition-colors cursor-pointer"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Constraints List */}
      {constraints.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-borderLight dark:border-slate-800 rounded-xl bg-bgLight dark:bg-slate-800/40">
          <p className="text-xs font-semibold text-textSub">No constraints defined.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {constraints.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-textSub w-6 text-right shrink-0">{idx + 1}.</span>
              <input
                type="text"
                value={c}
                onChange={(e) => handleUpdate(idx, e.target.value)}
                placeholder="e.g. 1 <= fruits.length <= 10^5"
                className="flex-1 px-3 py-2 bg-bgLight dark:bg-slate-800/60 border border-borderLight dark:border-slate-700 rounded-xl font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="p-2 text-textSub hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                title="Delete Constraint"
              >
                <LuTrash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
