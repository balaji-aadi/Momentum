import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { UserRole } from "../models/role.model.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin`);
        console.log(`MongoDB connected!`);
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

const createDefaultUser = async () => {
    await connectDB();

    try {
        // 1. Ensure Role Exists
        let role = await UserRole.findOne({ name: "admin" });
        if (!role) {
            console.log("Creating 'admin' role...");
            role = await UserRole.create({ name: "admin", active: true });
        } else {
            console.log("'admin' role already exists.");
        }

        // 2. Check User
        const email = "balajiaadi2000@gmail.com";
        let user = await User.findOne({ email });

        if (user) {
            console.log("User already exists.");
        } else {
            console.log("Creating user...");
            user = await User.create({
                email: email,
                password: "India@123",
                firstName: "Balaji", 
                lastName: "Aadi",
                phoneNumber: "9876543210", 
                userRole: role._id,
                isActive: true
            });
            console.log("User created successfully!");
        }

    } catch (error) {
        console.error("Error creating user:", error);
    } finally {
        await mongoose.disconnect();
    }
};

createDefaultUser();
