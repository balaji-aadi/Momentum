import React from 'react';

export const LinkedListType = {
  id: 'ListNode',
  aliases: ['listnode', 'linkedlist', 'singlylinkedlist'],
  label: 'Linked List (ListNode)',
  defaultVal: () => [1, 2, 3, 4, 5],
  placeholder: 'e.g. [1, 2, 3, 4, 5]',
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
    error: Array.isArray(val) ? null : 'Input linked list as a JSON array e.g. [1, 2, 3, 4]'
  }),
  renderInput: ({ value, onChange, placeholder, readOnly }) => {
    const displayVal = typeof value === 'object' ? JSON.stringify(value) : (value ?? '');
    const isArr = Array.isArray(value);

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
          placeholder={placeholder || 'e.g. [1, 2, 3, 4, 5]'}
          disabled={readOnly}
          className="w-full p-2.5 rounded-xl bg-surface dark:bg-slate-900 border border-borderLight dark:border-slate-700 text-textMain dark:text-white font-mono text-xs focus:outline-none focus:border-primary transition-all"
        />
        {isArr && value.length > 0 && (
          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1">
            <span>List visual:</span>
            <span>{value.join(' ➔ ')} ➔ null</span>
          </div>
        )}
      </div>
    );
  }
};
