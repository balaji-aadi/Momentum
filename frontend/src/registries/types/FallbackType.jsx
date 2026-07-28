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
    const displayVal = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '');
    return (
      <textarea
        rows={2}
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
        className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all resize-none"
      />
    );
  }
};
