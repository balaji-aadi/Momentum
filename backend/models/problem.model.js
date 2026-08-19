import mongoose, { Schema } from "mongoose";

const exampleSchema = new Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String, default: "" },
  order: { type: Number, default: 1 }
}, { _id: false });

const parameterSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true }, // number, string, boolean, number[], string[], boolean[], number[][], string[][], ListNode, RandomListNode, TreeNode, Graph
  required: { type: Boolean, default: true },
  nullable: { type: Boolean, default: false },
  description: { type: String, default: "" }
}, { _id: false });

const functionDefinitionSchema = new Schema({
  functionName: { type: String, default: "solution", trim: true },
  parameters: [parameterSchema],
  returnType: { type: String, default: "void", trim: true }
}, { _id: false });

const executionProfileSchema = new Schema({
  runtimeType: { 
    type: String, 
    enum: ['FUNCTION'], 
    default: 'FUNCTION' 
  },
  outputSerializer: { 
    type: String, 
    trim: true,
    default: 'PrimitiveSerializer' 
  },
  comparator: { 
    type: String, 
    trim: true,
    default: 'ExactMatch' 
  },
  customType: {
    type: String,
    trim: true,
    default: ''
  },
  inPlaceMutation: {
    type: Boolean,
    default: false
  },
  mutatedParameter: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const languageRuntimeSchema = new Schema({
  language: { type: String, required: true },
  runtime: {
    version: { type: String, default: "" },
    compiler: { type: String, default: "" },
    entryPoint: { type: String, default: "Solution" },
    boilerplateOverride: { type: String, default: "" }
  }
}, { _id: false });

const starterCodeSchema = new Schema({
  language: { type: String, required: true }, // e.g. "python", "javascript", "cpp", "java"
  code: { type: String, default: "" },
  functionSignature: { type: String, default: "" },
  defaultTemplate: { type: String, default: "" }
}, { _id: false });

const visibleTestCaseSchema = new Schema({
  input: { type: Schema.Types.Mixed, required: true }, // Structured JSON object or primitive
  expectedOutput: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, default: "" },
  order: { type: Number, default: 1 },
  weight: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const hiddenTestCaseSchema = new Schema({
  input: { type: Schema.Types.Mixed, required: true },
  expectedOutput: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, default: "" },
  weight: { type: Number, default: 1.0 },
  executionOrder: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  isPerformanceTest: { type: Boolean, default: false }
}, { _id: false });

const problemSchema = new Schema(
  {
    problemCode: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      trim: true 
    },
    problemType: { 
      type: String, 
      enum: ['DSA', 'SQL', 'Frontend_JS', 'System_Design', 'Aptitude', 'Mock_Interview'], 
      default: 'DSA' 
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true, 
      lowercase: true, 
      trim: true 
    },
    difficulty: { 
      type: String, 
      enum: ['Easy', 'Medium', 'Hard'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Draft', 'Review', 'Published', 'Archived'], 
      default: 'Draft',
      index: true 
    },
    companies: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Company' 
    }],
    topics: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Topic' 
    }],
    pattern: { 
      type: Schema.Types.ObjectId, 
      ref: 'Pattern' 
    },
    descriptionMarkdown: { 
      type: String, 
      required: true 
    },
    examples: [exampleSchema],
    constraints: [{ 
      type: String 
    }],
    hints: [{ 
      type: String 
    }],
    
    // Universal Execution Engine Schema Fields
    functionDefinition: {
      type: functionDefinitionSchema,
      default: () => ({ functionName: "twoSum", parameters: [], returnType: "void" })
    },
    executionProfile: {
      type: executionProfileSchema,
      default: () => ({ runtimeType: "FUNCTION", outputSerializer: "PrimitiveSerializer", comparator: "ExactMatch", customType: "", inPlaceMutation: false, mutatedParameter: "" })
    },
    languageRuntimes: [languageRuntimeSchema],

    starterCode: [starterCodeSchema],
    visibleTestCases: [visibleTestCaseSchema],
    hiddenTestCases: [hiddenTestCaseSchema],
    executionLimits: {
      timeLimitMs: { type: Number, default: 2000 },
      memoryLimitMb: { type: Number, default: 256 }
    },
    editorialMarkdown: { 
      type: String, 
      default: "" 
    },
    metadata: {
      estimatedSolveTime: { type: Number, default: 20 },
      xpReward: { type: Number, default: 50 },
      revisionWeight: { type: Number, default: 1 },
      interviewFrequency: { type: String, default: "Medium" },
      featuredProblem: { type: Boolean, default: false },
      contestProblem: { type: Boolean, default: false },
      learningObjective: { type: String, default: "" },
      prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
      recommendedNextProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }]
    },
    statistics: {
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 }
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    packageVersion: {
      type: String,
      default: 'v1.0.0'
    },
    packageHash: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Compound Index for student listing queries
problemSchema.index({ status: 1, difficulty: 1 });
problemSchema.index({ status: 1, problemType: 1 });

const Problem = mongoose.models.Problem || mongoose.model("Problem", problemSchema);
export default Problem;
