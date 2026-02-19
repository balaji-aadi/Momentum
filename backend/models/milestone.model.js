import mongoose, { Schema } from "mongoose";

const milestoneSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
  milestoneName: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  commenceDate: {
    type: Date,
    required: true,
  },
  expectedDate: {
    type: Date,
    required: true,
  },
  deliverables: {
    type: String,
    trim: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
}, {
  timestamps: true,
  versionKey: false
});

export const Milestone = mongoose.model('Milestone', milestoneSchema);
