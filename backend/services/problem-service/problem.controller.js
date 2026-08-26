import Problem from "../../models/problem.model.js";
import Company from "../../models/company.model.js";
import Topic from "../../models/topic.model.js";
import Pattern from "../../models/pattern.model.js";
import { 
  validateProblemTestCases, 
  validateExecutionProfileCompatibility,
  validateStarterCodeOverrides
} from "./problem.validator.js";

// Helper to generate clean URL slug
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ==================== CHECK SLUG AVAILABILITY ====================
export const checkSlugAvailability = async (req, res) => {
  try {
    const rawSlug = req.query.slug || "";
    if (!rawSlug) return res.status(400).json({ success: false, message: "Slug parameter is required" });

    const baseSlug = generateSlug(rawSlug);
    let candidateSlug = baseSlug;
    let counter = 1;

    while (await Problem.exists({ slug: candidateSlug })) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const available = candidateSlug === baseSlug;
    return res.status(200).json({
      success: true,
      available,
      requestedSlug: baseSlug,
      suggestedSlug: candidateSlug
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE PROBLEM ====================
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      problemType = 'DSA',
      difficulty,
      status = 'Draft',
      companies = [],
      topics = [],
      pattern,
      descriptionMarkdown,
      examples = [],
      constraints = [],
      hints = [],
      functionDefinition = { functionName: 'solution', parameters: [], returnType: 'void' },
      executionProfile = { runtimeType: 'FUNCTION', outputSerializer: 'PrimitiveSerializer', comparator: 'ExactMatch' },
      languageRuntimes = [],
      starterCode = [],
      visibleTestCases = [],
      hiddenTestCases = [],
      executionLimits = { timeLimitMs: 2000, memoryLimitMb: 256 },
      editorialMarkdown = '',
      metadata = {},
      statistics = {}
    } = req.body;

    // Required Field Validation
    if (!title || !difficulty || !descriptionMarkdown) {
      return res.status(400).json({
        success: false,
        message: "Title, Difficulty, and Description Markdown are required fields."
      });
    }

    // Pre-flight Cross-Field Execution Profile & Test Case Validation
    try {
      validateExecutionProfileCompatibility(functionDefinition, executionProfile);
      validateProblemTestCases(functionDefinition, visibleTestCases, hiddenTestCases);
      validateStarterCodeOverrides(starterCode, functionDefinition);
    } catch (valErr) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${valErr.message}`
      });
    }

    // Slug generation & duplicate check
    let baseSlug = generateSlug(customSlug || title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await Problem.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate Problem Code (e.g. DSA-101)
    const count = await Problem.countDocuments();
    const problemCode = `${problemType.toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const newProblem = await Problem.create({
      problemCode,
      problemType,
      title,
      slug: finalSlug,
      difficulty,
      status,
      companies,
      topics,
      pattern: pattern || null,
      descriptionMarkdown,
      examples,
      constraints,
      hints,
      functionDefinition,
      executionProfile,
      languageRuntimes,
      starterCode,
      visibleTestCases,
      hiddenTestCases,
      executionLimits,
      editorialMarkdown,
      metadata,
      statistics,
      createdBy: req.user?._id || req.userId || null
    });

    return res.status(201).json({
      success: true,
      message: "Problem created successfully!",
      data: newProblem
    });
  } catch (error) {
    console.error("Create Problem Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET ALL PROBLEMS ====================
export const getAllProblems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      difficulty, 
      problemType, 
      search,
      company,
      topic 
    } = req.query;

    const query = {};

    // Filter by Status (Default: all non-archived problems for CMS management)
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'Archived' };
    }

    if (difficulty) query.difficulty = difficulty;
    if (problemType) query.problemType = problemType;
    if (company) query.companies = company;
    if (topic) query.topics = topic;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problemCode: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .populate("companies", "name logoUrl slug")
        .populate("topics", "name category slug")
        .populate("pattern", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Problem.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET PROBLEM BY ID OR SLUG ====================
export const getProblemByIdOrSlug = async (req, res) => {
  try {
    const idOrSlug = req.params.identifier || req.params.idOrSlug || req.params.id;
    if (!idOrSlug) {
      return res.status(400).json({ success: false, message: "Problem identifier is required" });
    }

    const cleanSlug = idOrSlug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const isObjectId = Boolean(idOrSlug.match(/^[0-9a-fA-F]{24}$/));

    const query = isObjectId
      ? { _id: idOrSlug }
      : {
          $or: [
            { slug: idOrSlug.toLowerCase() },
            { slug: cleanSlug },
            { problemCode: idOrSlug.toUpperCase() },
            { problemCode: idOrSlug.toLowerCase() },
            { title: { $regex: new RegExp(`^${idOrSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } }
          ]
        };

    const problem = await Problem.findOne(query)
      .populate("companies", "name logoUrl slug")
      .populate("topics", "name category slug")
      .populate("pattern", "name slug");

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    return res.status(200).json({ success: true, data: problem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProblemBySlugOrId = getProblemByIdOrSlug;

// ==================== UPDATE PROBLEM ====================
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Prevent updating problemCode manually
    delete updates.problemCode;

    // Pre-flight Validation if functionDefinition, executionProfile, starterCode, or testcases are being updated
    if (updates.functionDefinition || updates.executionProfile || updates.starterCode || updates.visibleTestCases || updates.hiddenTestCases) {
      try {
        const existing = await Problem.findById(id);
        const fnDef = updates.functionDefinition || existing?.functionDefinition;
        const execProfile = updates.executionProfile || existing?.executionProfile;
        const visTC = updates.visibleTestCases || existing?.visibleTestCases || [];
        const hidTC = updates.hiddenTestCases || existing?.hiddenTestCases || [];
        const starterCode = updates.starterCode || existing?.starterCode || [];
        
        validateExecutionProfileCompatibility(fnDef, execProfile);
        validateProblemTestCases(fnDef, visTC, hidTC);
        validateStarterCodeOverrides(starterCode, fnDef);
      } catch (valErr) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: ${valErr.message}`
        });
      }
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedProblem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully!",
      data: updatedProblem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ARCHIVE (SOFT DELETE) PROBLEM ====================
export const archiveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findByIdAndUpdate(
      id,
      { $set: { status: 'Archived' } },
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Problem archived successfully!",
      data: problem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== COMPILE PROBLEM PACKAGE ====================
export const compileProblemPackage = async (req, res) => {
  try {
    const { ProblemPackageCompiler } = await import('../judge/ProblemPackageCompiler.js');
    const pkg = await ProblemPackageCompiler.compilePackage(req.body);
    return res.status(200).json({
      success: true,
      package: pkg
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PUBLISH PROBLEM PACKAGE ====================
export const publishProblemPackage = async (req, res) => {
  try {
    const { problemId, pkg } = req.body;
    if (!pkg || !pkg.hiddenTestCases) {
      return res.status(400).json({ success: false, message: "Valid problem package JSON is required." });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

    const compiledHidden = pkg.hiddenTestCases.map(tc => ({
      input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
      expectedOutput: typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
      isHidden: true,
      explanation: tc.category || 'Generated Testcase'
    }));

    // Preserve existing manual hidden testcases if requested or present
    const existingManualHidden = (problem.hiddenTestCases || []).filter(
      tc => !tc.explanation || (!tc.explanation.includes('Generated') && tc.explanation !== 'Standard' && tc.explanation !== 'WorstCaseTwoSum')
    );

    problem.hiddenTestCases = [...existingManualHidden, ...compiledHidden];
    problem.status = 'Published';
    problem.packageVersion = pkg.packageVersion || 'v1.0.0';
    problem.packageHash = pkg.hashSignature;
    await problem.save();

    return res.status(200).json({
      success: true,
      message: `Problem package successfully published with ${problem.hiddenTestCases.length} total hidden evaluation cases (${existingManualHidden.length} manual + ${compiledHidden.length} generated).`,
      problem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
