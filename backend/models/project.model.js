import mongoose, { Schema } from "mongoose";

const projectSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    access: { 
      type: String, 
      enum: ["public", "private"], 
      required: true 
    },
    key: { 
      type: String, 
      required: true, 
      unique: true 
    },
    description: { 
      type: String 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      required: true 
    },
    clientName: { 
      type: String, 
      default : ''
    },
    githubRepository: {
      type: String,
      default: '' // e.g. https://github.com/my-org/my-repo
    },
    budget: { 
      type: Number, 
      default : ''
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    projectManager: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    teamMembers: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    }],
    rolesAndResponsibilities: [
      {
        teamMember: { 
          type: Schema.Types.ObjectId, 
          ref: "User", 
          required: true 
        },
        role: { 
          type: String, 
          required: true 
        },
        responsibility: { 
          type: String, 
          required: true 
        },
      },
    ],
    status: { 
      type: String, 
      enum: ["active", "inactive", "completed", "hold", "closed"], 
      required: true,
      default: "active",
    },
    settings: {
      sprintDuration: { type: Number, default: 2 }, // weeks
      enableSprints: { type: Boolean, default: false },
      enableYoutubeSearch: { type: Boolean, default: false },
      enableLeetCodeSearch: { type: Boolean, default: false }
    },
    createdBy : {
      type : Schema.Types.ObjectId, 
      ref: "User", 
    },
    updatedBy : {
      type : Schema.Types.ObjectId, 
      ref: "User", 
    }
  }, 
  { 
    timestamps: true,
    versionKey: false, 
});
  

export const Project = mongoose.model("Project", projectSchema);