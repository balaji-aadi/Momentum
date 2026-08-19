import mongoose, { Schema } from "mongoose";

const userArenaScheduleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    tasksPerDay: {
      type: Number,
      default: 4,
      min: 1
    },
    revisionDaysPerParent: {
      type: Number,
      default: 2,
      min: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    totalParentTasks: {
      type: Number,
      default: 0
    },
    calculatedTotalDays: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound Unique Index: One timeline configuration per user per Arena
userArenaScheduleSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const UserArenaSchedule = mongoose.model("UserArenaSchedule", userArenaScheduleSchema);
