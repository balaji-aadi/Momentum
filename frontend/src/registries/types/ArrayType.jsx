import React from 'react';

export const ArrayNumberType = {
  id: 'number[]',
  aliases: ['array', 'vector<int>', 'int[]', 'list[int]'],
  label: 'Number Array (1D)',
  defaultVal: () => [2, 7, 11, 15],
  placeholder: 'e.g. [2, 7, 11, 15]',
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
    error: Array.isArray(val) ? null : 'Input must be a valid JSON array of numbers e.g. [1, 2, 3]'
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
        placeholder={placeholder || 'e.g. [2, 7, 11, 15]'}
        disabled={readOnly}
        className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
      />
    );
  }
};

export const ArrayStringType = {
  id: 'string[]',
  aliases: ['vector<string>', 'string_array', 'list[str]'],
  label: 'String Array (1D)',
  defaultVal: () => ["flower", "flow", "flight"],
  placeholder: 'e.g. ["flower", "flow", "flight"]',
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
    error: Array.isArray(val) ? null : 'Input must be a valid JSON array of strings e.g. ["a", "b"]'
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
        placeholder={placeholder || 'e.g. ["a", "b", "c"]'}
        disabled={readOnly}
        className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
      />
    );
  }
};
