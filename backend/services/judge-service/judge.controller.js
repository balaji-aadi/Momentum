import Problem from "../../models/problem.model.js";
import { executePythonJudge } from "../judge/pythonJudgeRunner.js";

// ==================== EXECUTE CODE (RUN API) ====================
export const runCode = async (req, res) => {
  try {
    const { problemId, language = 'python', code, customTestCases } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code parameter cannot be empty." });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: problemId.toLowerCase() };
      problem = await Problem.findOne(query);
    }

    const functionDefinition = problem?.functionDefinition || {
      functionName: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const executionProfile = problem?.executionProfile || {
      runtimeType: 'FUNCTION',
      inputParser: 'ArrayParser',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    // Use custom test cases if provided by student, otherwise default to problem visible testcases
    const testCases = (customTestCases && customTestCases.length > 0)
      ? customTestCases
      : (problem?.visibleTestCases || [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
        ]);

    const executionResult = await executePythonJudge({
      studentCode: code,
      functionDefinition,
      executionProfile,
      testCases,
      timeLimitMs: problem?.executionLimits?.timeLimitMs || 2000
    });

    return res.status(200).json({
      success: true,
      message: `Execution completed with status: ${executionResult.status}`,
      data: executionResult
    });
  } catch (error) {
    console.error("Run Code API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute code."
    });
  }
};

// ==================== SUBMIT CODE (SUBMIT API) ====================
export const submitCode = async (req, res) => {
  try {
    const { problemId, language = 'python', code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code parameter cannot be empty." });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: problemId.toLowerCase() };
      problem = await Problem.findOne(query);
    }

    const functionDefinition = problem?.functionDefinition || {
      functionName: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const executionProfile = problem?.executionProfile || {
      runtimeType: 'FUNCTION',
      inputParser: 'ArrayParser',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    // Combine all test cases: visible + hidden
    const visible = problem?.visibleTestCases || [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
    ];
    const hidden = problem?.hiddenTestCases || [];
    const allTestCases = [...visible, ...hidden];

    const executionResult = await executePythonJudge({
      studentCode: code,
      functionDefinition,
      executionProfile,
      testCases: allTestCases,
      timeLimitMs: problem?.executionLimits?.timeLimitMs || 2000
    });

    return res.status(200).json({
      success: true,
      message: `Submission evaluated with verdict: ${executionResult.verdict}`,
      data: executionResult
    });
  } catch (error) {
    console.error("Submit Code API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process submission."
    });
  }
};
