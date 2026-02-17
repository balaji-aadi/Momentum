import mongoose, { Schema } from "mongoose";

const epicSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    summary: {
      type: String,
      trim: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    color: {
      type: String,
      default: "#8777D9" // Default purple color for epics
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do"
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export const Epic = mongoose.model("Epic", epicSchema);
