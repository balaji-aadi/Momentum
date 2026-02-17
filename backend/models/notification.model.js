import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
      senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      receiverId: { 
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
      },
      title: {
         type: String,
         required: true
      },
      message: { 
        type: String,
         required: true
      },
      notificationStatus: {
        type: Boolean,
        default: false
      },
      createdAt: { 
        type: Date,
        default: Date.now
      }
    },
    { timestamps: true, 
      versionKey: false
    });


export const Notification = mongoose.model("Notification", notificationSchema);