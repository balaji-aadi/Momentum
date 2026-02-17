import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// User Schema Started
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userRole: {
      type: Schema.Types.ObjectId,
      ref: "UserRole",
      // required: true, // Making optional as we move to userRoles
    },
    userRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserRole",
      }
    ],
    firstName: {
      type: String,
      maxlength: 250,
      required: true,
    },
    lastName: {
      type: String,
      maxlength: 250,
      default: null,
    },
    phoneNumber: {
      type: String,
      maxlength: 15,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      maxlength: 250,
      default: null,
    },
    otpTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,  
    versionKey: false, 
  }
);

// User Schema End

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      phone_number: this.phone_number,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


export const User = mongoose.model("User", userSchema);
