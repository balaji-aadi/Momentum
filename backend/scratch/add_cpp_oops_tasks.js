import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import connectDB from "../config/db.config.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { ProgressService } from "../services/progress-service/progress.service.js";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  const projectId = new mongoose.Types.ObjectId("6a30c5bcf7cfd43d78e67bf8");
  const project = await Project.findById(projectId);
  if (!project) {
    console.error("❌ Project 'Resume Grinding Phase 1' not found!");
    process.exit(1);
  }
  console.log(`Found Project: "${project.name}" (ID: ${project._id})`);

  const userId = new mongoose.Types.ObjectId("6993047f16e85ff3e4efd9a3");
  const branchId = new mongoose.Types.ObjectId("6a081b6e111c99b633b00d76");

  // Find current max RGB taskId number across all tasks
  const allRgbTasks = await Task.find({ taskId: /^RGB-/ });
  let maxNum = 0;
  allRgbTasks.forEach(t => {
    if (t.taskId) {
      const num = parseInt(t.taskId.replace("RGB-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  console.log(`Current max RGB taskId number: ${maxNum}`);

  let taskIdCounter = maxNum + 1;

  // Define dates
  // 5 Aug 2026 to 10 Aug 2026
  const parentStartDate = new Date("2026-08-05T00:00:00.000Z");
  const parentDueDate = new Date("2026-08-10T23:59:59.999Z");

  const childTitles = [
    "Oops is life",
    "How to create objects in c++",
    "Encapsulation",
    "Implementing Encapsulation in c++",
    "Inheritance",
    "Implementing Inheritance in c++",
    "Polymorphism in c++",
    "Abstraction in c++"
  ];

  // 1. Create Parent Task
  const parentTaskData = {
    projectName: projectId,
    taskName: "C++ (oops)",
    taskId: `RGB-${taskIdCounter++}`,
    taskPriority: "high",
    taskType: "preparation",
    taskStartDate: parentStartDate,
    taskDueDate: parentDueDate,
    estimatedHours: childTitles.length * 2.5,
    backlogEstimatedHours: 0,
    storyPoints: 0,
    progress: 0,
    status: "todo",
    assignee: userId,
    createdBy: userId,
    updatedBy: userId,
    parentTask: null,
    subtaskStats: { total: childTitles.length, completed: 0 },
    branchId: branchId,
    attachments: [],
    dependentTasks: [],
    activityLogs: [],
    revisionLogs: []
  };

  const parentTask = await Task.create(parentTaskData);
  console.log(`✅ Created Parent Task: "${parentTask.taskName}" (ID: ${parentTask._id}, TaskId: "${parentTask.taskId}")`);

  // Schedule child tasks across Aug 5 to Aug 10
  // Days: Aug 5, Aug 6, Aug 7, Aug 8, Aug 9, Aug 10
  const childScheduleOffsets = [0, 0, 1, 1, 2, 2, 3, 4]; // 5th, 5th, 6th, 6th, 7th, 7th, 8th, 9th Aug

  const createdChildren = [];
  for (let i = 0; i < childTitles.length; i++) {
    const offset = childScheduleOffsets[i];
    const childDate = new Date(parentStartDate);
    childDate.setDate(childDate.getDate() + offset);

    const childDueDate = new Date(childDate);
    childDueDate.setUTCHours(23, 59, 59, 999);

    const childTaskData = {
      projectName: projectId,
      taskName: childTitles[i],
      taskId: `RGB-${taskIdCounter++}`,
      taskPriority: "medium",
      taskType: "preparation",
      taskStartDate: childDate,
      taskDueDate: childDate,
      estimatedHours: 2.5,
      backlogEstimatedHours: 0,
      storyPoints: 0,
      progress: 0,
      status: "todo",
      assignee: userId,
      createdBy: userId,
      updatedBy: userId,
      parentTask: parentTask._id,
      subtaskStats: { total: 0, completed: 0 },
      branchId: branchId,
      attachments: [],
      dependentTasks: [],
      activityLogs: [],
      revisionLogs: []
    };

    const childTask = await Task.create(childTaskData);
    createdChildren.push(childTask);
    console.log(`   └─ ✅ Created Child Task ${i + 1}: "${childTask.taskName}" (ID: ${childTask._id}, TaskId: "${childTask.taskId}", Date: ${childDate.toISOString().split('T')[0]})`);
  }

  // 2. Update progress stats
  await ProgressService.updateParentTaskProgress(parentTask._id);
  await ProgressService.updateProjectProgress(projectId);

  console.log("\n🎉 Successfully added parent task and all 8 child tasks to Resume Grinding Phase 1!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error adding tasks:", err);
  process.exit(1);
});
