import mongoose from "mongoose";
import dotenv from "dotenv";
import { Task } from "./models/task.model.js";

dotenv.config();

async function checkSubtaskStats() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tasks = await Task.find({ taskId: { $in: ["DSA-73", "DSA-51", "DSA-173"] } }).lean();
  for (const t of tasks) {
    console.log(`Task ${t.taskId}:`);
    console.log("  subtaskStats in DB:", t.subtaskStats);
    console.log("  taskStartDate in DB:", t.taskStartDate);
    console.log("  taskDueDate in DB:", t.taskDueDate);
    console.log("  progress in DB:", t.progress);
    console.log("  status in DB:", t.status);
  }
  await mongoose.disconnect();
}

checkSubtaskStats().catch(console.error);
