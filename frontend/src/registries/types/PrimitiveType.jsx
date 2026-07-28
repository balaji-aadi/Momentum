import React from 'react';

export const PrimitiveNumberType = {
  id: 'number',
  aliases: ['int', 'float', 'double', 'integer'],
  label: 'Number (int/float)',
  defaultVal: () => 0,
  placeholder: 'e.g. 9 or 3.14',
  parse: (raw) => {
    if (typeof raw === 'number') return raw;
    const n = Number(raw);
    return isNaN(n) ? raw : n;
  },
  serialize: (val) => Number(val) || 0,
  validate: (val) => ({ valid: !isNaN(Number(val)), error: isNaN(Number(val)) ? 'Must be a valid number' : null }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(isNaN(Number(val)) || val === '' ? val : Number(val));
      }}
      placeholder={placeholder || 'e.g. 9'}
      disabled={readOnly}
      className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
    />
  )
};

export const PrimitiveStringType = {
  id: 'string',
  aliases: ['str', 'char'],
  label: 'String',
  defaultVal: () => '',
  placeholder: 'e.g. "anagram"',
  parse: (raw) => String(raw ?? ''),
  serialize: (val) => String(val ?? ''),
  validate: (val) => ({ valid: typeof val === 'string', error: null }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'e.g. "leetcode"'}
      disabled={readOnly}
      className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
    />
  )
};

export const PrimitiveBooleanType = {
  id: 'boolean',
  aliases: ['bool'],
  label: 'Boolean (true/false)',
  defaultVal: () => true,
  placeholder: 'true or false',
  parse: (raw) => raw === 'true' || raw === true,
  serialize: (val) => Boolean(val),
  validate: () => ({ valid: true, error: null }),
  renderInput: ({ value, onChange, readOnly }) => (
    <select
      value={String(value ?? true)}
      onChange={(e) => onChange(e.target.value === 'true')}
      disabled={readOnly}
      className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all cursor-pointer"
    >
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  )
};
