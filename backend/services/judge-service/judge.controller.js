import Problem from "../../models/problem.model.js";
import { RunCodeService } from "./runCode.service.js";
import { SubmitCodeService } from "./submitCode.service.js";

// ==================== EXECUTE CODE (RUN API - PHASE 8) ====================
export const runCode = async (req, res) => {
  try {
    const { problemId, language = 'javascript', code, customTestCases } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code parameter cannot be empty."
      });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = typeof problemId === 'string' && problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: String(problemId).toLowerCase() };
      problem = await Problem.findOne(query);
    }

    const runResult = await RunCodeService.run({
      problem,
      language,
      code,
      customTestCases
    });

    return res.status(200).json({
      success: runResult.success,
      message: `Execution completed with status: ${runResult.status}`,
      data: runResult
    });
  } catch (error) {
    console.error("Run Code API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute code."
    });
  }
};

// ==================== SUBMIT CODE (SUBMIT API - PHASE 9) ====================
export const submitCode = async (req, res) => {
  try {
    const { problemId, language = 'javascript', code } = req.body;
    const userId = req.user?._id || req.user?.id || null;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code parameter cannot be empty."
      });
    }

    let problem = null;
    if (problemId) {
      const isObjectId = typeof problemId === 'string' && problemId.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: problemId } : { slug: String(problemId).toLowerCase() };
      problem = await Problem.findOne(query);
    }

    const submitResult = await SubmitCodeService.submit({
      problem,
      language,
      code,
      userId
    });

    return res.status(200).json({
      success: submitResult.success,
      message: `Submission evaluated with verdict: ${submitResult.verdict}`,
      data: submitResult
    });
  } catch (error) {
    console.error("Submit Code API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process submission."
    });
  }
};
