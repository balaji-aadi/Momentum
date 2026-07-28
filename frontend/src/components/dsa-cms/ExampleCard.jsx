import React from 'react';
import { 
  LuListTree, 
  LuPlus, 
  LuTrash2, 
  LuCopy, 
  LuChevronUp, 
  LuChevronDown 
} from 'react-icons/lu';

export default function ExampleCard({ formData, setFormData }) {
  const examples = formData.examples || [];

  // Add new blank example
  const handleAddExample = () => {
    const newExample = {
      input: '',
      output: '',
      explanation: '',
      order: examples.length + 1
    };
    setFormData(prev => ({
      ...prev,
      examples: [...(prev.examples || []), newExample]
    }));
  };

  // Update example field
  const handleUpdate = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.examples || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, examples: updated };
    });
  };

  // Delete example
  const handleDelete = (index) => {
    setFormData(prev => {
      const updated = (prev.examples || []).filter((_, i) => i !== index);
      const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      return { ...prev, examples: reordered };
    });
  };

  // Duplicate example
  const handleDuplicate = (index) => {
    setFormData(prev => {
      const itemToCopy = prev.examples[index];
      const copy = { ...itemToCopy, order: prev.examples.length + 1 };
      const updated = [...prev.examples];
      updated.splice(index + 1, 0, copy);
      const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      return { ...prev, examples: reordered };
    });
  };

  // Move Up / Down
  const handleMove = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === examples.length - 1) return;

    setFormData(prev => {
      const updated = [...prev.examples];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      return { ...prev, examples: reordered };
    });
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-borderLight dark:border-slate-800 p-6 shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderLight dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LuListTree size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain dark:text-white">Examples ({examples.length})</h2>
            <p className="text-xs text-textSub">Sample inputs, expected outputs, and step-by-step explanations.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddExample}
          className="px-3.5 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <LuPlus size={15} />
          <span>Add Example</span>
        </button>
      </div>

      {/* Examples List */}
      {examples.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-borderLight dark:border-slate-800 rounded-xl bg-bgLight dark:bg-slate-800/40">
          <p className="text-xs font-semibold text-textSub">No examples added yet.</p>
          <button
            type="button"
            onClick={handleAddExample}
            className="mt-3 px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <LuPlus size={14} />
            <span>Create First Example</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {examples.map((ex, idx) => (
            <div key={idx} className="bg-bgLight dark:bg-slate-800/40 rounded-xl border border-borderLight dark:border-slate-700 p-4 space-y-3 relative group">
              {/* Card Title & Reorder Actions */}
              <div className="flex items-center justify-between pb-2 border-b border-borderLight/60 dark:border-slate-700/60">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold">{idx + 1}</span>
                  <span>Example {idx + 1}</span>
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-textSub hover:text-textMain disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    title="Move Up"
                  >
                    <LuChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === examples.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-textSub hover:text-textMain disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    title="Move Down"
                  >
                    <LuChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(idx)}
                    className="p-1 text-textSub hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    title="Duplicate Example"
                  >
                    <LuCopy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1 text-textSub hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Delete Example"
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Input / Output Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-textSub">Input</label>
                  <textarea
                    rows={2}
                    value={ex.input || ''}
                    onChange={(e) => handleUpdate(idx, 'input', e.target.value)}
                    placeholder="e.g. fruits = [1,2,1]"
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Output */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-textSub">Output</label>
                  <textarea
                    rows={2}
                    value={ex.output || ''}
                    onChange={(e) => handleUpdate(idx, 'output', e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg font-mono text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Explanation Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-textSub">Explanation (Optional)</label>
                <input
                  type="text"
                  value={ex.explanation || ''}
                  onChange={(e) => handleUpdate(idx, 'explanation', e.target.value)}
                  placeholder="e.g. We can pick from all 3 trees because there are only 2 distinct types of fruit [1, 2]."
                  className="w-full p-2.5 bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 rounded-lg text-xs text-textMain dark:text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
