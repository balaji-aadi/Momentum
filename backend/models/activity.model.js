import mongoose, { Schema } from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: ["Email", "Todo", "Call", "Meeting", "Upload Document"],
      required: true,
    },
    type: {
      type: String,
      enum: ["Bug", "Task", "Testcase"],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    summary: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    meetingStartDate: {
      type: Date,
    },
    meetingEndDate: {
      type: Date,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true, versionKey: false }
);


export const Activity = mongoose.model("Activity", activitySchema);
