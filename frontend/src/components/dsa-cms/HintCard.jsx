import React from 'react';
import { 
  LuLightbulb, 
  LuPlus, 
  LuTrash2 
} from 'react-icons/lu';

export default function HintCard({ formData, setFormData }) {
  const hints = formData.hints || [];

  // Add hint
  const handleAddHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...(prev.hints || []), '']
    }));
  };

  // Update hint text
  const handleUpdate = (index, value) => {
    setFormData(prev => {
      const updated = [...(prev.hints || [])];
      updated[index] = value;
      return { ...prev, hints: updated };
    });
  };

  // Delete hint
  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      hints: (prev.hints || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
            <LuLightbulb size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">Progressive Hints ({hints.length})</h2>
            <p className="text-xs text-textSub">Step-by-step clues provided to students when they request assistance.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddHint}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <LuPlus size={15} />
          <span>Add Hint</span>
        </button>
      </div>

      {/* Hints List */}
      {hints.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-borderLight dark:border-slate-800 rounded-xl bg-bgLight dark:bg-slate-800/40">
          <p className="text-xs font-semibold text-textSub">No hints added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hints.map((hint, idx) => (
            <div key={idx} className="bg-bgLight dark:bg-slate-800/40 p-3.5 rounded-xl border border-borderLight dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <LuLightbulb size={14} />
                  <span>Hint {idx + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-1 text-textSub hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                  title="Delete Hint"
                >
                  <LuTrash2 size={14} />
                </button>
              </div>

              <textarea
                rows={2}
                value={hint}
                onChange={(e) => handleUpdate(idx, e.target.value)}
                placeholder={`e.g. Try using a sliding window approach with two pointers (left, right) and a hash map to count fruit frequencies.`}
                className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg text-xs text-textMain dark:text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
