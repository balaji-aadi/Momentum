import mongoose from "mongoose";

const patternSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: "" 
    }
  },
  { timestamps: true }
);

const Pattern = mongoose.models.Pattern || mongoose.model("Pattern", patternSchema);
export default Pattern;
