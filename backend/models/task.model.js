import mongoose, { Schema } from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectName: { 
      type: Schema.Types.ObjectId, 
      ref: "Project", 
      required: false // Changed from true to false to allow personal tasks
    },
    taskName: { 
      type: String, 
      required: true 
    },
    taskPriority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      required: true 
    },
    taskType: { 
      type: String, 
      required: true 
    },
    estimatedHours: { 
      type: Number 
    },
    storyPoints: {
      type: Number,
      default: 0
    },
    epic: {
      type: Schema.Types.ObjectId,
      ref: "Epic"
    },
    sprint: {
      type: Schema.Types.ObjectId,
      ref: "Sprint"
    },
    taskDescription: { 
      type: String 
    },
    attachments: [{ 
      type: String 
    }],
    milestone: {
      type: Schema.Types.ObjectId,
      ref: "Milestone",
      default: null
    },
    assignee: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      default: null
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    taskStartDate: { 
      type: Date, 
      required: false // Can be optional if it's just a backlog item
    },
    taskDueDate: { 
      type: Date, 
      required: false // Can be optional if it's just a backlog item
    },
    additionalNotes: { 
      type: String 
    },
    dependentTasks: [{
      type: Schema.Types.ObjectId, 
      ref: "Task" 
    }],
    dependencyType: { 
      type: String, 
      enum: ["start-to-start", "start-to-finish", "finish-to-start", "finish-to-finish"],
      default: "start-to-start"
    },
    status: { 
      type: String, 
      enum: ["todo", "inprogress", "done", "hold"],
      default: "todo"
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    activityLogs: [
      {
        oldStatus: { type: String, default: "" },
        currentStatus: { type: String, default: "" },
        user: { 
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null 
        },
        date: { type: Date, default: Date.now },
        message: { type: String, default: "" }
      }
    ]
  }, 
  { 
    timestamps: true, 
    versionKey: false 
  }
);

export const Task = mongoose.model("Task", taskSchema);
