import { mongoose, Schema } from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    milestone: {
          type: Schema.Types.ObjectId,
          ref: "Milestone",
          default: null
    },
    testCaseName: {
      type: String,
      required: true
    },
    testStatus: { 
      type: String, 
      enum: ["Not Executed", "Pass", "Fail"],
      default: "Not Executed"
    },
    assignee: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      default: null
    },
    preconditions: {
      type: String,
      default: ""
    },
    testScenarioDescription: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      default: null
    },
    testSteps: [
        {
          description: { 
            type: String,
            required: true
          },
          expectedOutcome: { 
            type: String,
            required: true
          },
        },
      ],
      activityLogs: [
        {
          oldStatus: {
            type: String,
            default: null
          },
          currentStatus: {
            type: String,
            required: true
          },
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", required: true },
          date: { 
            type: Date,
            default: Date.now
          },
          message: {
            type: String,
            required: true
          },
        },
      ],
    },
    { timestamps: true,
      versionKey: false
    }
  );
export const TestCase = mongoose.model("TestCase", testCaseSchema);