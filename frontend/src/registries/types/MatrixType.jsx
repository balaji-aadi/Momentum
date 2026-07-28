import React from 'react';

export const MatrixType = {
  id: 'number[][]',
  aliases: ['matrix', '2d_array', 'vector<vector<int>>', 'list[list[int]]'],
  label: '2D Matrix (number[][])',
  defaultVal: () => [[1, 2], [3, 4]],
  placeholder: 'e.g. [[1,3,5,7],[10,11,16,20],[23,30,34,60]]',
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
    valid: Array.isArray(val) && val.every(row => Array.isArray(row)),
    error: Array.isArray(val) ? null : 'Input must be a valid 2D JSON matrix e.g. [[1,2],[3,4]]'
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
        placeholder={placeholder || 'e.g. [[1,2],[3,4]]'}
        disabled={readOnly}
        className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
      />
    );
  }
};
