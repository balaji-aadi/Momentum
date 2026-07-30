import React from 'react';

export const FallbackType = {
  id: 'fallback',
  label: 'Generic / Custom Type',
  defaultVal: () => '',
  placeholder: 'Enter raw value or JSON',
  parse: (raw) => raw,
  serialize: (val) => val,
  validate: () => ({ valid: true, error: null }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => {
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');

    return (
      <input
        type="text"
        value={displayVal}
        onChange={(e) => {
          const raw = e.target.value;
          try {
            onChange(JSON.parse(raw));
          } catch (err) {
            onChange(raw);
          }
        }}
        placeholder={placeholder || 'Enter value'}
        disabled={readOnly}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] dark:bg-slate-900 border border-[#333333] dark:border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-primary/80 transition-all shadow-xs"
      />
    );
  }
};
