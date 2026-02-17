import mongoose, { Schema } from "mongoose";

const sprintSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    goal: {
      type: String,
      trim: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ["future", "active", "closed"],
      default: "future"
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: "Task"
    }]
  },
  {
    timestamps: true
  }
);

export const Sprint = mongoose.model("Sprint", sprintSchema);
