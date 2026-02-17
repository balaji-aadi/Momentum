import mongoose, { Schema } from "mongoose";

const bugSchema = new mongoose.Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    bugTitle: {
      type: String,
      required: true,
    },
    bugDescription: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    reproducibility: {
      type: String,
      enum: ["Always", "Sometimes", "Rarely", "Unable To Reproduce"],
      required: true,
    },
    stepsToReproduce: {
      type: [String],
    },
    assignee: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
    },
    bugStatus: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    attachment: {
      type: String, // Store file path or URL
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    activityLogs: {
          type: [
            {
              oldStatus: { type: String, default: null },
              currentStatus: { type: String, required: true },
              user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
              date: { type: Date, default: Date.now },
              message: { type: String, required: true }
            }
          ],
          default: []
        }
  },
  { timestamps: true,
    versionKey: false
});

export const Bug = mongoose.model("Bug", bugSchema);
