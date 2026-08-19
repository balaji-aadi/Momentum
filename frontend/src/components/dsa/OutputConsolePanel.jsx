import React, { useState } from 'react';
import { useCodingArena } from './CodingArenaContext';
import { ExecutionProfileRegistry } from '../../registries/ExecutionProfileRegistry';
import { 
  LuTerminal, 
  LuCheckCircle2, 
  LuXCircle, 
  LuPlus, 
  LuPlay, 
  LuSend, 
  LuZap, 
  LuX,
  LuTrophy,
  LuCheckSquare,
  LuChevronDown,
  LuChevronUp,
  LuAlertTriangle
} from 'react-icons/lu';

export function OutputConsolePanel() {
  const { 
    problem,
    testCases, 
    addTestCase, 
    removeTestCase,
    updateTestCase,
    activeTestCaseIndex, 
    setActiveTestCaseIndex, 
    activeConsoleTab, 
    setActiveConsoleTab, 
    isConsoleCollapsed,
    setIsConsoleCollapsed,
    isRunning, 
    handleRunCode, 
    isSubmitting, 
    handleSubmitCode, 
    runResult, 
    submitResult 
  } = useCodingArena();

  const [selectedResultCaseIdx, setSelectedResultCaseIdx] = useState(0);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const resultsList = runResult?.testCases || runResult?.results || runResult?.testResults || [];
  const parameters = problem?.functionDefinition?.parameters || [];
  const isRunPassed = runResult?.status === 'PASSED' || runResult?.status === 'Accepted' || runResult?.status === 'ACCEPTED';
  const isSubmitAccepted = 
    submitResult?.status === 'Accepted' || 
    submitResult?.status === 'ACCEPTED' || 
    submitResult?.verdict === 'Accepted' || 
    submitResult?.verdict === 'ACCEPTED';

  return (
    <div className={`flex flex-col bg-[#1a1a1a] text-slate-200 overflow-hidden select-none border-t border-[#2d2d2d] transition-all duration-300 ${isConsoleCollapsed ? 'h-10' : 'h-full'}`}>
      {/* Console Tabs Header (Exact LeetCode Image 2 & 3 Layout) */}
      <div className="h-10 border-b border-[#2d2d2d] bg-[#1a1a1a] px-3 flex items-center justify-between shrink-0 font-sans">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveConsoleTab('testcase');
              if (isConsoleCollapsed) setIsConsoleCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeConsoleTab === 'testcase' && !isConsoleCollapsed
                ? 'bg-[#262626] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LuCheckSquare size={14} className="text-emerald-500" />
            <span>Testcase</span>
          </button>

          <span className="text-slate-700 text-xs font-mono">|</span>

          <button
            onClick={() => {
              setActiveConsoleTab('result');
              if (isConsoleCollapsed) setIsConsoleCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all relative cursor-pointer ${
              activeConsoleTab === 'result' && !isConsoleCollapsed
                ? 'bg-[#262626] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LuTerminal size={14} className="text-emerald-500" />
            <span>Test Result</span>
            {runResult && (
              <span className={`w-2 h-2 rounded-full ${isRunPassed ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            )}
          </button>

          {submitResult && (
            <>
              <span className="text-slate-700 text-xs font-mono">|</span>
              <button
                onClick={() => {
                  setActiveConsoleTab('submission');
                  if (isConsoleCollapsed) setIsConsoleCollapsed(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeConsoleTab === 'submission' && !isConsoleCollapsed
                    ? 'bg-[#262626] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LuTrophy size={14} className="text-amber-400" />
                <span>Submission Result</span>
                <span className={`w-2 h-2 rounded-full ${isSubmitAccepted ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              </button>
            </>
          )}
        </div>

        {/* LeetCode Right Console Controls: Expand/Collapse Chevrons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsConsoleCollapsed(prev => !prev)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#262626] rounded-md transition-colors cursor-pointer"
            title={isConsoleCollapsed ? "Expand Console" : "Collapse Console"}
          >
            {isConsoleCollapsed ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Console Content Area */}
      {!isConsoleCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {/* TAB 1: TESTCASE INPUT VIEW */}
          {activeConsoleTab === 'testcase' && (
            <div className="space-y-4 font-mono">
              <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-1">
                {testCases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCaseIdx(i)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCaseIdx === i
                        ? 'bg-[#262626] text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#262626]/40'
                    }`}
                  >
                    <span>Case {i + 1}</span>
                  </button>
                ))}
              </div>

              {testCases[selectedCaseIdx] && (() => {
                const currentCase = testCases[selectedCaseIdx];
                return (
                  <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-slate-800">
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Input</div>
                      {parameters.length > 0 ? (
                        parameters.map((param) => {
                          let parsedInput = currentCase.input;
                          if (typeof parsedInput === 'string') {
                            try {
                              parsedInput = JSON.parse(parsedInput);
                            } catch (e) {}
                          }

                          let val = (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput))
                            ? parsedInput[param.name]
                            : parsedInput;

                          if (val === undefined && typeof currentCase.input === 'object' && currentCase.input !== null) {
                            val = currentCase.input[param.name] ?? currentCase.input;
                          }

                          return (
                            <div key={param.name} className="space-y-1">
                              <span className="text-slate-400 font-mono font-bold">{param.name} =</span>
                              <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-slate-200 font-mono text-xs">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-slate-200 font-mono text-xs">
                          {typeof currentCase.input === 'object' ? JSON.stringify(currentCase.input) : String(currentCase.input || '')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Expected Output</div>
                      <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-emerald-400 font-bold">
                        {typeof currentCase.expectedOutput === 'object' ? JSON.stringify(currentCase.expectedOutput) : String(currentCase.expectedOutput || '')}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: TEST RESULT BREAKDOWN */}
          {activeConsoleTab === 'result' && (
            <div className="space-y-4">
              {!runResult ? (
                <div className="text-center py-8 text-slate-500 italic">
                  Click "Run" to execute your solution against test cases.
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Result Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      {isRunPassed ? (
                        <LuCheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <LuXCircle size={20} className="text-rose-400" />
                      )}
                      <span className={`font-extrabold text-base ${isRunPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {runResult.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
                      <span>Runtime: <strong className="text-white">{runResult.executionTimeMs ?? 0} ms</strong></span>
                    </div>
                  </div>

                  {/* Top-Level Error or Diagnostic Alert Banner */}
                  {runResult.error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2 text-rose-400 font-bold font-sans text-xs">
                        <LuAlertTriangle size={15} />
                        <span>{runResult.errorType || runResult.status || 'Execution Error'}</span>
                      </div>
                      <pre className="text-rose-300 whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                        {runResult.error}
                      </pre>
                    </div>
                  )}

                  {/* Per Case Tab Bar */}
                  {resultsList.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-1">
                        {resultsList.map((res, i) => {
                          const isCasePass = res.status === 'PASSED' || res.passed === true;
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedResultCaseIdx(i)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedResultCaseIdx === i
                                  ? 'bg-[#262626] text-white border border-slate-700'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#262626]/40'
                              }`}
                            >
                              <span>Case {i + 1}</span>
                              <span className={`w-2 h-2 rounded-full ${isCasePass ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Case Breakdown */}
                      {resultsList[selectedResultCaseIdx] && (() => {
                        const curRes = resultsList[selectedResultCaseIdx];
                        const isCurPass = curRes.status === 'PASSED' || curRes.passed === true;
                        const inputCase = testCases[selectedResultCaseIdx] || {};

                        return (
                          <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-slate-800 font-mono text-xs">
                            {/* Render Parameter Inputs */}
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Input</div>
                              {parameters.length > 0 ? (
                                parameters.map((param) => {
                                  let parsedInput = curRes.input || inputCase.input;
                                  if (typeof parsedInput === 'string') {
                                    try {
                                      parsedInput = JSON.parse(parsedInput);
                                    } catch (e) {}
                                  }

                                  let val = (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput))
                                    ? parsedInput[param.name]
                                    : parsedInput;

                                  if (val === undefined && typeof (curRes.input || inputCase.input) === 'object') {
                                    val = (curRes.input || inputCase.input)?.[param.name] ?? (curRes.input || inputCase.input);
                                  }

                                  return (
                                    <div key={param.name} className="space-y-1">
                                      <span className="text-slate-400 font-mono font-bold">{param.name} =</span>
                                      <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-slate-200 font-mono text-xs">
                                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-slate-200 font-mono text-xs">
                                  {typeof curRes.input === 'object' ? JSON.stringify(curRes.input) : String(curRes.input || '')}
                                </div>
                              )}
                            </div>

                            {/* Output */}
                            <div className="space-y-1 pt-1">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Output</div>
                              <div className={`p-2.5 rounded-lg border ${isCurPass ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'}`}>
                                {curRes.actualOutput === null || curRes.actualOutput === undefined ? 'null' : (typeof curRes.actualOutput === 'object' ? JSON.stringify(curRes.actualOutput) : String(curRes.actualOutput))}
                              </div>
                            </div>

                            {/* Expected Output */}
                            <div className="space-y-1 pt-1">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Expected</div>
                              <div className="p-2.5 rounded-lg bg-[#262626] border border-slate-800 text-emerald-400 font-bold">
                                {curRes.expectedOutput === null || curRes.expectedOutput === undefined ? 'null' : (typeof curRes.expectedOutput === 'object' ? JSON.stringify(curRes.expectedOutput) : String(curRes.expectedOutput))}
                              </div>
                            </div>

                            {/* Diagnostic Diff Reason / Error */}
                            {curRes.reason && !isCurPass && (
                              <div className="space-y-1 pt-1">
                                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-sans">Diff Reason</div>
                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono leading-relaxed">
                                  {curRes.reason}
                                </div>
                              </div>
                            )}

                            {/* Runtime Error inside Case */}
                            {curRes.error && (
                              <div className="space-y-1 pt-1">
                                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider font-sans">Exception Details</div>
                                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono leading-relaxed">
                                  {curRes.error}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSION RESULT (With Failed Cases Debugger) */}
          {activeConsoleTab === 'submission' && submitResult && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="p-5 rounded-2xl bg-[#141414] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    {isSubmitAccepted ? (
                      <LuCheckCircle2 size={24} className="text-emerald-400" />
                    ) : (
                      <LuXCircle size={24} className="text-rose-400" />
                    )}
                    <div>
                      <h2 className={`text-xl font-black ${isSubmitAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {submitResult.verdict || submitResult.status}
                      </h2>
                      {submitResult.passedTestCases !== undefined && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Passed <strong className="text-white">{submitResult.passedTestCases} / {submitResult.totalTestCases}</strong> test cases
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {submitResult.error && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-mono text-rose-300 leading-relaxed">
                    {submitResult.error}
                  </div>
                )}

                {/* Failed Hidden Cases Breakdown */}
                {submitResult.results && submitResult.results.filter(r => !r.passed).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h3 className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>⚠️ Failed Test Cases ({submitResult.results.filter(r => !r.passed).length})</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">Testing Debug View</span>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {submitResult.results.filter(r => !r.passed).map((failedCase, idx) => (
                        <div key={idx} className="p-3.5 bg-[#1e1e1e] border border-rose-500/30 rounded-xl space-y-2 font-mono text-xs shadow-2xs">
                          <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 pb-2">
                            <span>Case #{failedCase.testCaseIndex || idx + 1}</span>
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                              {failedCase.executionTimeMs ? `${failedCase.executionTimeMs} ms` : 'Failed'}
                            </span>
                          </div>

                          {/* Input parameters breakdown (Matching LeetCode UI) */}
                          {failedCase.input && (
                            <div className="space-y-1.5 pt-1 border-b border-slate-800 pb-2">
                              <span className="text-slate-400 text-[11px] font-sans font-bold uppercase tracking-wider">Input</span>
                              {parameters.length > 0 ? (
                                parameters.map((param) => {
                                  let rawInp = failedCase.input;
                                  if (typeof rawInp === 'string') {
                                    try { rawInp = JSON.parse(rawInp); } catch (e) {}
                                  }
                                  const val = (typeof rawInp === 'object' && rawInp !== null)
                                    ? rawInp[param.name]
                                    : rawInp;
                                  return (
                                    <div key={param.name} className="space-y-0.5">
                                      <span className="text-slate-400 text-[11px]">{param.name} =</span>
                                      <div className="p-2 rounded-lg bg-[#141414] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto">
                                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-2 rounded-lg bg-[#141414] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto">
                                  {typeof failedCase.input === 'object' ? JSON.stringify(failedCase.input) : String(failedCase.input || '')}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <span className="text-slate-400 text-[11px] font-sans font-bold">Your Output:</span>
                              <div className="p-2 rounded-lg bg-[#141414] border border-slate-800 text-rose-300 font-bold overflow-x-auto">
                                {failedCase.actualOutput === null || failedCase.actualOutput === undefined
                                  ? 'null'
                                  : (typeof failedCase.actualOutput === 'object' ? JSON.stringify(failedCase.actualOutput) : String(failedCase.actualOutput))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-slate-400 text-[11px] font-sans font-bold">Expected Output:</span>
                              <div className="p-2 rounded-lg bg-[#141414] border border-slate-800 text-emerald-400 font-bold overflow-x-auto">
                                {failedCase.expectedOutput === null || failedCase.expectedOutput === undefined
                                  ? 'null'
                                  : (typeof failedCase.expectedOutput === 'object' ? JSON.stringify(failedCase.expectedOutput) : String(failedCase.expectedOutput))}
                              </div>
                            </div>
                          </div>

                          {(failedCase.message || failedCase.error) && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono leading-relaxed mt-2">
                              {failedCase.message || failedCase.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
