import React, { createContext, useState, useEffect, useContext } from 'react';
import { MockExecutionService } from '../../services/mockExecutionService';
import { NoteApi } from '../../services/api/Note.api';
import { JudgeApi } from '../../services/api/Judge.api';
import toast from 'react-hot-toast';

export const CodingArenaContext = createContext(null);

// Helper to generate dynamic starter code template if starterCode is missing or empty
const generateDynamicStarterCode = (fnDef, langKey) => {
  const name = fnDef?.functionName || fnDef?.name || 'solution';
  const params = fnDef?.parameters || [];
  const retType = fnDef?.returnType || 'void';
  const cleanLang = (langKey || '').toLowerCase().trim();

  if (cleanLang.includes('python')) {
    const paramStr = params.map(p => {
      const pName = p.name || 'param';
      const pType = p.type === 'number[]' || p.type === 'array' ? 'List[int]'
        : p.type === 'string' ? 'str'
        : p.type === 'boolean' ? 'bool' : 'int';
      return `${pName}: ${pType}`;
    }).join(', ');
    const pyParams = paramStr ? `self, ${paramStr}` : 'self';
    const pyRet = retType === 'number[]' || retType === 'array' || retType === 'matrix' ? 'List[int]'
      : retType === 'string' ? 'str'
      : retType === 'boolean' ? 'bool' : 'int';
    return `class Solution:\n    def ${name}(${pyParams}) -> ${pyRet}:\n        pass\n`;
  }

  if (cleanLang.includes('js') || cleanLang.includes('javascript')) {
    const paramNames = params.map(p => p.name || 'param').join(', ');
    const docComments = params.map(p => ` * @param {${p.type || 'any'}} ${p.name || 'param'}`).join('\n');
    return `/**\n${docComments}\n * @return {${retType}}\n */\nvar ${name} = function(${paramNames}) {\n    \n};\n`;
  }

  if (cleanLang.includes('c++') || cleanLang.includes('cpp')) {
    const paramStr = params.map(p => {
      const pName = p.name || 'param';
      const pType = p.type === 'number[]' || p.type === 'array' ? 'vector<int>&'
        : p.type === 'string' ? 'string'
        : p.type === 'boolean' ? 'bool' : 'int';
      return `${pType} ${pName}`;
    }).join(', ');
    const cppRet = retType === 'number[]' || retType === 'array' || retType === 'matrix' ? 'vector<int>'
      : retType === 'string' ? 'string'
      : retType === 'boolean' ? 'bool' : 'int';
    return `class Solution {\npublic:\n    ${cppRet} ${name}(${paramStr}) {\n        \n    }\n};\n`;
  }

  if (cleanLang.includes('java')) {
    const paramStr = params.map(p => {
      const pName = p.name || 'param';
      const pType = p.type === 'number[]' || p.type === 'array' ? 'int[]'
        : p.type === 'string' ? 'String'
        : p.type === 'boolean' ? 'boolean' : 'int';
      return `${pType} ${pName}`;
    }).join(', ');
    const javaRet = retType === 'number[]' || retType === 'array' || retType === 'matrix' ? 'int[]'
      : retType === 'string' ? 'String'
      : retType === 'boolean' ? 'boolean' : 'int';
    return `class Solution {\n    public ${javaRet} ${name}(${paramStr}) {\n        \n    }\n}\n`;
  }

  return `// Write your solution for ${name}\n`;
};

// Helper to resolve starter code across array and object formats
const resolveStarterCode = (problemObj, langKey) => {
  if (!problemObj) return '';
  const cleanLang = (langKey || '').toLowerCase().trim();
  
  // Normalize language key: 'python3' -> 'python', 'javascript' -> 'javascript', 'cpp' -> 'cpp'
  const langNormalized = cleanLang.includes('python') ? 'python' 
    : cleanLang.includes('js') || cleanLang.includes('javascript') ? 'javascript'
    : cleanLang.includes('c++') || cleanLang.includes('cpp') ? 'cpp'
    : cleanLang.includes('java') ? 'java' : cleanLang;

  if (Array.isArray(problemObj.starterCode) && problemObj.starterCode.length > 0) {
    const found = problemObj.starterCode.find(s => 
      s.language === langNormalized || 
      s.language?.toLowerCase() === langNormalized ||
      s.language?.toLowerCase() === cleanLang
    );
    if (found && found.code && found.code.trim()) return found.code;
    if (problemObj.starterCode[0]?.code && problemObj.starterCode[0].code.trim()) {
      return problemObj.starterCode[0].code;
    }
  }

  if (typeof problemObj.starterCode === 'object' && problemObj.starterCode !== null) {
    const val = problemObj.starterCode[langNormalized] || 
                problemObj.starterCode[cleanLang] || 
                problemObj.starterCode.python || 
                problemObj.starterCode.javascript || 
                Object.values(problemObj.starterCode)[0];
    if (val && typeof val === 'string' && val.trim()) return val;
  }

  return generateDynamicStarterCode(problemObj.functionDefinition, langKey);
};

// Helper to resolve visible test cases from MongoDB
const resolveTestCases = (problemObj) => {
  if (!problemObj) return [];
  if (Array.isArray(problemObj.visibleTestCases) && problemObj.visibleTestCases.length > 0) {
    return problemObj.visibleTestCases.map(tc => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || tc.output || '',
      explanation: tc.explanation || ''
    }));
  }
  if (Array.isArray(problemObj.testCases) && problemObj.testCases.length > 0) {
    return problemObj.testCases;
  }
  return [
    { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
    { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' }
  ];
};

export function CodingArenaProvider({ problem, task, onClose, onSolveSuccess, children }) {
  const problemId = problem._id || problem.id || problem.slug || "dsa-problem";

  // State: Language & Code Editor
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(`dsa_lang_${problemId}`) || 'python';
  });

  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(`dsa_code_${problemId}_${language}`);
    if (saved) return saved;
    return resolveStarterCode(problem, language);
  });

  // State: Editor Appearance & Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('dsa_editor_theme') || 'leetcode-dark');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('dsa_editor_fontsize')) || 14);

  // State: Test Cases & Execution Output
  const [testCases, setTestCases] = useState(() => resolveTestCases(problem));
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase');
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // State: Real Linked Notes from Sarthi Task
  const [taskLinkedNotes, setTaskLinkedNotes] = useState([]);

  // Fetch Linked Notes for Task from backend API
  useEffect(() => {
    if (task?._id || task?.taskId || task?.taskName) {
      NoteApi.getNotes()
        .then((res) => {
          const allNotes = res.data?.data || res.data || [];
          const taskNameClean = (task.taskName || '').toLowerCase().trim();
          const matched = allNotes.filter((n) => {
            const isDirectTask = n.task === task._id || n.task?._id === task._id;
            const isLinkedArr = Array.isArray(n.linkedTasks) && n.linkedTasks.some(t => t === task._id || t?._id === task._id);
            const isTitleMatch = taskNameClean && n.title?.toLowerCase().includes(taskNameClean);
            return isDirectTask || isLinkedArr || isTitleMatch;
          });
          setTaskLinkedNotes(matched);
        })
        .catch((err) => {
          console.error("Failed to fetch task notes:", err);
        });
    }
  }, [task]);

  // State: Notes, Submissions, Solved status, and XP Points
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem(`dsa_notes_${problemId}`) || (task?.taskDescription || '');
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem(`dsa_submissions_${problemId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [isSolved, setIsSolved] = useState(() => {
    const savedSolved = localStorage.getItem(`dsa_solved_${problemId}`);
    if (savedSolved === 'true') return true;
    if (problem?.isSolved) return true;
    const savedSubs = localStorage.getItem(`dsa_submissions_${problemId}`);
    if (savedSubs) {
      try {
        const parsed = JSON.parse(savedSubs);
        return parsed.some(s => s.status === 'Accepted');
      } catch (e) {}
    }
    return false;
  });

  const [userXp, setUserXp] = useState(() => {
    const savedXp = localStorage.getItem('sarthi_user_xp');
    return savedXp !== null ? Number(savedXp) : 0;
  });

  // Listen for storage events to keep userXp synced across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sarthi_user_xp');
      setUserXp(saved !== null ? Number(saved) : 0);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // State: Timer / Stopwatch
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Sync testcases & code whenever problem or language changes
  useEffect(() => {
    if (problem) {
      const resolvedTC = resolveTestCases(problem);
      if (resolvedTC.length > 0) setTestCases(resolvedTC);
    }
  }, [problem]);

  useEffect(() => {
    localStorage.setItem(`dsa_lang_${problemId}`, language);
    const saved = localStorage.getItem(`dsa_code_${problemId}_${language}`);
    if (saved && saved.trim()) {
      setCode(saved);
    } else {
      const starter = resolveStarterCode(problem, language);
      setCode(starter);
    }
  }, [language, problemId, problem]);

  // Cache Code changes per problem & language
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    localStorage.setItem(`dsa_code_${problemId}_${language}`, newCode);
  };

  // Notes persistence
  const handleNotesChange = (newNotes) => {
    setNotes(newNotes);
    localStorage.setItem(`dsa_notes_${problemId}`, newNotes);
  };

  // Reset Code to default starter template
  const handleResetCode = () => {
    const starter = resolveStarterCode(problem, language);
    setCode(starter);
    localStorage.removeItem(`dsa_code_${problemId}_${language}`);
    return starter;
  };

  // Execution: Run Code on Visible Test Cases via backend REST API
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveConsoleTab('result');
    setIsConsoleCollapsed(false);
    try {
      const res = await JudgeApi.runCode({
        problemId: problem?._id || problemId,
        language,
        code,
        customTestCases: testCases
      });

      if (res.data?.data) {
        setRunResult(res.data.data);
      } else {
        setRunResult({
          success: false,
          status: 'EXECUTION_ERROR',
          error: res.data?.message || 'Code execution failed.'
        });
      }
    } catch (err) {
      setRunResult({
        success: false,
        status: 'NETWORK_ERROR',
        error: err.response?.data?.data?.error || err.response?.data?.message || err.message || 'Code execution failed.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submission: Submit Code against All (Visible + Hidden) Test Cases via backend REST API
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setActiveConsoleTab('submission');
    setIsConsoleCollapsed(false);
    try {
      const res = await JudgeApi.submitCode({
        problemId: problem?._id || problemId,
        language,
        code
      });

      if (res.data?.data) {
        const data = res.data.data;
        setSubmitResult(data);

        const isAcc = data.verdict === 'Accepted' || data.verdict === 'ACCEPTED';
        const newSub = {
          id: Date.now().toString(),
          status: data.verdict || (isAcc ? 'Accepted' : 'Wrong Answer'),
          language,
          runtime: `${data.executionTimeMs || 18} ms`,
          memory: `14.2 MB`,
          passedTestCases: data.passedTestCases,
          totalTestCases: data.totalTestCases,
          submittedAt: 'Just now'
        };

        const updatedSubs = [newSub, ...submissions];
        setSubmissions(updatedSubs);
        localStorage.setItem(`dsa_submissions_${problemId}`, JSON.stringify(updatedSubs));

        if (isAcc) {
          setIsSolved(true);
          localStorage.setItem(`dsa_solved_${problemId}`, 'true');

          if (!isSolved) {
            const problemXp = problem?.metadata?.xpReward ?? problem?.xpReward ?? 50;
            const newXp = (userXp || 0) + problemXp;
            setUserXp(newXp);
            localStorage.setItem('sarthi_user_xp', String(newXp));
            window.dispatchEvent(new Event('storage'));
            toast.success(`🎉 Problem Solved! +${problemXp} XP Earned!`);
          } else {
            toast.success('Accepted! All test cases passed.');
          }

          if (onSolveSuccess) {
            onSolveSuccess(newSub);
          }
        }
      } else {
        setSubmitResult({
          status: 'Runtime Error',
          error: res.data?.message || 'Submission evaluation failed.'
        });
      }
    } catch (err) {
      setSubmitResult({
        status: 'Runtime Error',
        error: err.message || 'Submission failed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTestCase = () => {
    const params = problem?.functionDefinition?.parameters || [];
    let newInput = {};
    if (params.length > 0) {
      params.forEach(p => {
        newInput[p.name] = p.type?.includes('[]') ? [] : (p.type === 'number' ? 0 : '');
      });
    } else {
      newInput = '';
    }

    const newCase = { input: newInput, expectedOutput: '' };
    setTestCases(prev => [...prev, newCase]);
    setActiveTestCaseIndex(testCases.length);
  };

  const removeTestCase = (index) => {
    if (testCases.length <= 1) return;
    setTestCases(prev => prev.filter((_, i) => i !== index));
    if (activeTestCaseIndex >= index && activeTestCaseIndex > 0) {
      setActiveTestCaseIndex(prev => prev - 1);
    }
  };

  const updateTestCase = (index, updatedFields) => {
    setTestCases(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      return copy;
    });
  };

  const contextValue = {
    problem,
    task,
    taskLinkedNotes,
    problemId,
    language,
    setLanguage,
    code,
    setCode: handleCodeChange,
    handleCodeChange,
    resetCode: handleResetCode,
    handleResetCode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    testCases,
    setTestCases,
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
    isSubmitting,
    runResult,
    submitResult,
    handleRunCode,
    handleSubmitCode,
    notes,
    handleNotesChange,
    submissions,
    isSolved,
    userXp,
    timerSeconds,
    isTimerRunning,
    setIsTimerRunning,
    onClose
  };

  return (
    <CodingArenaContext.Provider value={contextValue}>
      {children}
    </CodingArenaContext.Provider>
  );
}

export function useCodingArena() {
  const ctx = useContext(CodingArenaContext);
  if (!ctx) {
    throw new Error('useCodingArena must be used within a CodingArenaProvider');
  }
  return ctx;
}
