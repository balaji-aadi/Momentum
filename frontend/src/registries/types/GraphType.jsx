import React from 'react';

export const GraphType = {
  id: 'Graph',
  aliases: ['graph', 'adjacency_list', 'adjlist'],
  label: 'Graph (Adjacency List)',
  defaultVal: () => [[2, 4], [1, 3], [2, 4], [1, 3]],
  placeholder: 'e.g. [[2,4],[1,3],[2,4],[1,3]]',
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
    error: Array.isArray(val) ? null : 'Input graph as adjacency list 2D JSON array e.g. [[2,4],[1,3]]'
  }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => {
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : (value ?? '');
    return (
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
        placeholder={placeholder || 'e.g. [[2,4],[1,3]]'}
        disabled={readOnly}
        className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
      />
    );
  }
};
