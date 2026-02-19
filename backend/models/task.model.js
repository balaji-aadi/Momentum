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
    taskId: {
      type: String,
      unique: true,
      sparse: true
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
    progress: {
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
    // Hierarchy
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true
    },
    dependentTasks: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Task" 
    }],
    
    // Performance Indexes (defined below, but fields here)
    assignee: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      default: null,
      index: true 
    },
    status: { 
      type: String, 
      enum: ["todo", "inprogress", "review", "done", "hold", "backlog"],
      default: "todo",
      index: true
    },
    
    // Computed Subs Stats (for optimization)
    subtaskStats: {
        total: { type: Number, default: 0 },
        completed: { type: Number, default: 0 }
    },

    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    createdBy: {
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

// Compound Indexes for Common Queries
taskSchema.index({ projectName: 1, status: 1 }); // Dashboard filtering
taskSchema.index({ assignee: 1, status: 1 });    // "My Tasks" filtering

export const Task = mongoose.model("Task", taskSchema);
