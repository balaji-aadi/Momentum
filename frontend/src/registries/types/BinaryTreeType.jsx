import React from 'react';

export const BinaryTreeType = {
  id: 'TreeNode',
  aliases: ['treenode', 'binarytree', 'tree'],
  label: 'Binary Tree (TreeNode)',
  defaultVal: () => [1, null, 2, 3],
  placeholder: 'e.g. [1, null, 2, 3] (BFS level-order)',
  parse: (raw) => {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return raw;
  },
  serialize: (val) => (Array.isArray(val) ? val : []),
  validate: (val) => ({
    valid: Array.isArray(val),
    error: Array.isArray(val) ? null : 'Input binary tree as BFS level-order JSON array e.g. [1, null, 2, 3]'
  }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => {
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : (value ?? '');
    return (
      <div className="space-y-1.5">
        <input
          type="text"
          value={displayVal}
          onChange={(e) => {
            const raw = e.target.value;
            try {
              const parsed = JSON.parse(raw);
              onChange(parsed);
            } catch (err) {
              onChange(raw);
            }
          }}
          placeholder={placeholder || 'e.g. [1, null, 2, 3]'}
          disabled={readOnly}
          className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
        />
        {Array.isArray(value) && (
          <div className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 inline-flex items-center gap-1">
            <span>Root:</span>
            <span>{value[0] !== undefined ? String(value[0]) : 'null'} | Total BFS Nodes: {value.length}</span>
          </div>
        )}
      </div>
    );
  }
};
