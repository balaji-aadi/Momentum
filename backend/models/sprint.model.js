import mongoose, { Schema } from "mongoose";

const sprintSchema = new Schema({
  project: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  goal: { 
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['planned', 'active', 'completed'], 
    default: 'planned',
    index: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true,
  versionKey: false
});

// Index to ensure unique sprint names within a project
sprintSchema.index({ project: 1, name: 1 }, { unique: true });

export const Sprint = mongoose.model("Sprint", sprintSchema);
