import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    oldStatus: { type: String, default: null },
    currentStatus: { type: String, required: true },
    date: { type: Date, default: Date.now },
    message: { type: String, default: "" }
  },
  { _id: false }
);

const revisionLogSchema = new Schema(
  {
    revisionDate: { type: Date, default: Date.now },
    notes: { type: String, default: "" }
  },
  { _id: false }
);

const userTaskProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    projectName: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true
    },
    status: {
      type: String,
      enum: ["todo", "inprogress", "review", "done", "hold", "backlog"],
      default: "todo",
      index: true
    },
    taskStartDate: {
      type: Date,
      default: null
    },
    taskDueDate: {
      type: Date,
      default: null
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    holdDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    activityLogs: [activityLogSchema],
    revisionLogs: [revisionLogSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound Unique Index: One progress/execution record per user per task
userTaskProgressSchema.index({ userId: 1, taskId: 1 }, { unique: true });

// Compound Indexes for fast user queries in Arenas and Modules
userTaskProgressSchema.index({ userId: 1, projectName: 1, status: 1 });
userTaskProgressSchema.index({ userId: 1, branchId: 1, status: 1 });

export const UserTaskProgress = mongoose.model("UserTaskProgress", userTaskProgressSchema);
