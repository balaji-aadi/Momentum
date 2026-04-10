import mongoose, { Schema } from "mongoose";

const performanceStatSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["user", "project"],
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
      // Note: refPath is not used here because it can be multiple models, 
      // we'll handle the reference in the application logic or use dynamic ref if needed.
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    metrics: {
      hoursLogged: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      storyPointsDone: { type: Number, default: 0 },
      onTimeTasks: { type: Number, default: 0 },
      delayedTasks: { type: Number, default: 0 },
      reopenedTasks: { type: Number, default: 0 },
      totalTasksAssigned: { type: Number, default: 0 },
      accountabilityLogs: { type: Number, default: 0 }
    }
  },
  { timestamps: true, versionKey: false }
);

// Compound index for fast lookups during aggregation/dashboard fetching
performanceStatSchema.index({ entityType: 1, entityId: 1, period: 1, date: 1 }, { unique: true });

export const PerformanceStat = mongoose.model("PerformanceStat", performanceStatSchema);
