import mongoose from "mongoose";

const languageSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    monacoId: { 
      type: String, 
      required: true, 
      trim: true 
    },
    defaultTemplate: { 
      type: String, 
      default: "" 
    }
  },
  { timestamps: true }
);

const Language = mongoose.models.Language || mongoose.model("Language", languageSchema);
export default Language;
