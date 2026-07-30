import React from 'react';

export const RandomListNodeType = {
  id: 'RandomListNode',
  aliases: ['randomlistnode', 'randomlist', 'node'],
  label: 'Random Pointer List (Node)',
  defaultVal: () => [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]],
  placeholder: 'e.g. [[7,null],[13,0],[11,4]]',
  parse: (raw) => {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { }
    return raw;
  },
  serialize: (val) => (Array.isArray(val) ? val : []),
  validate: (val) => ({
    valid: Array.isArray(val),
    error: Array.isArray(val) ? null : 'Input as 2D pair array e.g. [[7,null],[13,0]]'
  }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => {
    // Compact single-line JSON string representation (matching Image 2 & 3 format)
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    const isArr = Array.isArray(value);

    return (
      <div className="space-y-1.5 w-full font-sans">
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
          placeholder={placeholder || 'e.g. [[7,null],[13,0],[11,4]]'}
          disabled={readOnly}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] dark:bg-slate-900 border border-[#333333] dark:border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-primary/80 transition-all shadow-xs"
        />
        {isArr && value.length > 0 && (
          <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-indigo-400">Random List ({value.length} Nodes):</span>
            <span>{value.map((pair, idx) => `[N${idx}: v=${Array.isArray(pair) ? pair[0] : pair}, r➔${Array.isArray(pair) ? (pair[1] !== null ? `N${pair[1]}` : 'null') : 'null'}]`).join(' ➔ ')}</span>
          </div>
        )}
      </div>
    );
  }
};
