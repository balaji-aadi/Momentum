import mongoose, { Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true
    },
    problemCode: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    language: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true
    },
    verdict: {
      type: String,
      required: true,
      enum: [
        "ACCEPTED",
        "WRONG_ANSWER",
        "RUNTIME_ERROR",
        "TIME_LIMIT_EXCEEDED",
        "OUTPUT_LIMIT_EXCEEDED",
        "COMPILE_ERROR",
        "SYNTAX_ERROR",
        "PROCESS_ERROR"
      ],
      index: true
    },
    passedTestCases: {
      type: Number,
      default: 0
    },
    totalTestCases: {
      type: Number,
      default: 0
    },
    executionTimeMs: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

export default Submission;
