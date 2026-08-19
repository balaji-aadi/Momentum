import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model.js";
import { Project } from "./models/project.model.js";
import { Task } from "./models/task.model.js";
import { UserTaskProgress } from "./models/userTaskProgress.model.js";
import { UserArenaSchedule } from "./models/userArenaSchedule.model.js";

dotenv.config();

async function trace() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Real MongoDB");

  // 1. Find User 'test one'
  const testUser = await User.findOne({ email: /test/i }).lean();
  console.log("=== TEST USER ===");
  console.log("ID:", testUser?._id);
  console.log("Name:", testUser?.firstName, testUser?.lastName);
  console.log("Email:", testUser?.email);

  // 2. Find Project 'DSA phase 1'
  const project = await Project.findOne({ name: /DSA phase 1/i }).lean();
  console.log("\n=== PROJECT ===");
  console.log("ID:", project?._id);
  console.log("Name:", project?.name);
  console.log("Key:", project?.key);

  // 3. Find Tasks: DSA-73, DSA-51, DSA-173
  const taskIdsToFind = ["DSA-73", "DSA-51", "DSA-173"];
  const tasks = await Task.find({ taskId: { $in: taskIdsToFind } }).lean();

  console.log("\n=== CANONICAL TASK MASTER RECORDS ===");
  for (const t of tasks) {
    console.log(`\n--- Task ${t.taskId} (${t._id}) ---`);
    console.log("TaskName:", t.taskName);
    console.log("TaskType:", t.taskType);
    console.log("ParentTask:", t.parentTask);
    console.log("Master status:", t.status);
    console.log("Master progress:", t.progress);
    console.log("Master taskStartDate:", t.taskStartDate);
    console.log("Master taskDueDate:", t.taskDueDate);
    console.log("Master completedAt:", t.completedAt);
    console.log("Master estimatedHours:", t.estimatedHours);
    console.log("Master estimatedTime:", t.estimatedTime);
    console.log("Master estimatedDuration:", t.estimatedDuration);
    console.log("Master subtasks (if any):", t.subtasks?.length);

    // 4. Query UserTaskProgress for testUser
    if (testUser) {
      const utp = await UserTaskProgress.findOne({ userId: testUser._id, taskId: t._id }).lean();
      console.log(`UserTaskProgress for 'test one' (${testUser._id}):`, utp ? {
        _id: utp._id,
        status: utp.status,
        progress: utp.progress,
        taskStartDate: utp.taskStartDate,
        taskDueDate: utp.taskDueDate,
        completedAt: utp.completedAt
      } : "NOT FOUND");
    }

    // 5. Query ALL UserTaskProgress for this task across all users
    const allUtp = await UserTaskProgress.find({ taskId: t._id }).lean();
    console.log(`All UserTaskProgress count across DB:`, allUtp.length);
    for (const u of allUtp) {
      console.log(`  - User ${u.userId}: status=${u.status}, progress=${u.progress}, start=${u.taskStartDate}, due=${u.taskDueDate}`);
    }
  }

  // 6. Check UserArenaSchedule for testUser on this project
  if (testUser && project) {
    const sched = await UserArenaSchedule.findOne({ userId: testUser._id, projectId: project._id }).lean();
    console.log("\n=== USER ARENA SCHEDULE for 'test one' ===");
    console.log("Schedule:", sched || "NONE FOUND");
  }

  await mongoose.disconnect();
}

trace().catch(console.error);
