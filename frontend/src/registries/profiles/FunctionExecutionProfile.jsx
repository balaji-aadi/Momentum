import React from 'react';
import { DataTypeRegistry } from '../DataTypeRegistry';

export const FunctionExecutionProfile = {
  id: 'FUNCTION',
  name: 'Function Execution (LeetCode Style)',
  description: 'Standard function-based problems (Two Sum, Reverse List, Max Depth) evaluating input parameter maps.',

  renderTestCaseInput: ({ testCase, parameters, onUpdateInput, readOnly }) => {
    if (!parameters || parameters.length === 0) {
      const plugin = DataTypeRegistry.get('fallback');
      return plugin.renderInput({
        value: testCase.input,
        onChange: (newVal) => onUpdateInput(newVal),
        readOnly
      });
    }

    let parsedObj = {};
    if (typeof testCase.input === 'object' && testCase.input !== null) {
      parsedObj = testCase.input;
    } else if (typeof testCase.input === 'string') {
      try {
        parsedObj = JSON.parse(testCase.input);
      } catch (e) {
        parsedObj = {};
      }
    }

    const handleParamChange = (paramName, newVal) => {
      const currentInput = (typeof parsedObj === 'object' && parsedObj !== null && !Array.isArray(parsedObj))
        ? parsedObj
        : {};

      onUpdateInput({ ...currentInput, [paramName]: newVal });
    };

    return (
      <div className="space-y-3">
        {parameters.map((param) => {
          const plugin = DataTypeRegistry.get(param.type);
          const rawVal = parsedObj && typeof parsedObj === 'object' && !Array.isArray(parsedObj) && param.name in parsedObj
            ? parsedObj[param.name]
            : (typeof testCase.input === 'string' ? testCase.input : plugin.defaultVal());

          return (
            <div key={param.name} className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{param.name} =</span>
                <span className="text-[10px] text-slate-500 font-normal">({plugin.label})</span>
              </label>
              {plugin.renderInput({
                value: rawVal,
                onChange: (newVal) => handleParamChange(param.name, newVal),
                placeholder: plugin.placeholder,
                readOnly
              })}
            </div>
          );
        })}
      </div>
    );
  }
};
