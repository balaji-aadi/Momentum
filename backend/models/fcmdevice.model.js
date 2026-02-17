import mongoose, { Schema } from "mongoose";

const FCMDeviceSchema = new Schema(
    {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      fcm_token: {
        type: String,
        required: true,
      },
      device_type: {
        type: String,
        enum: ["android", "ios", "web"],
        required: true,
      },
      device_id: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
   
  export const FCMDevice = mongoose.model("FCMDevice", FCMDeviceSchema);