import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Branch } from "../models/branch.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import { UserArenaSchedule } from "../models/userArenaSchedule.model.js";
import { FocusSession } from "../models/focusSession.model.js";
import AnalyticsService from "../services/analytics-service/analytics.service.js";
import taskController from "../services/task-service/task.controller.js";
import projectController from "../services/project-service/project.controller.js";

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log("================================================================================");
  console.log("STARTING COMPREHENSIVE USER EXECUTION ISOLATION TEST SUITE");
  console.log("================================================================================");

  const connectionUri = process.env.DB_NAME
    ? `${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin`
    : process.env.MONGODB_URI;
  
  let connected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(connectionUri, { family: 4, serverSelectionTimeoutMS: 30000 });
      connected = true;
      break;
    } catch (e) {
      console.log(`Connection attempt ${attempt} failed, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  if (!connected) throw new Error("Could not connect to MongoDB after 5 attempts");
  console.log("Connected to MongoDB");

  // 1. Create Test Branch & Canonical Arena / Project
  const testBranch = await Branch.create({
    name: "Isolation Branch " + Date.now(),
    code: "IB-" + Date.now(),
    slug: "ib-" + Date.now(),
    description: "Branch for isolation testing"
  });

  // 2. Define 3 Users: ADMIN, USER_A, USER_B
  const adminId = new mongoose.Types.ObjectId();
  const userA_Id = new mongoose.Types.ObjectId();
  const userB_Id = new mongoose.Types.ObjectId();

  const adminUser = {
    _id: adminId,
    firstName: "Admin",
    lastName: "Tester",
    email: "admin@example.com",
    userRole: { name: "admin" },
    userRoles: [{ name: "admin" }],
    branchAccess: [{ branchId: testBranch._id, roles: ["ADMIN"] }]
  };

  const userA = {
    _id: userA_Id,
    firstName: "UserA",
    lastName: "Tester",
    email: "usera@example.com",
    userRole: { name: "member" },
    userRoles: [{ name: "member" }],
    branchAccess: [{ branchId: testBranch._id, roles: ["MEMBER"] }]
  };

  const userB = {
    _id: userB_Id,
    firstName: "UserB",
    lastName: "Tester",
    email: "userb@example.com",
    userRole: { name: "member" },
    userRoles: [{ name: "member" }],
    branchAccess: [{ branchId: testBranch._id, roles: ["MEMBER"] }]
  };

  // 3. Create Canonical Project & 133 Canonical Tasks
  const canonicalProject = await Project.create({
    name: "Canonical DSA Phase 1",
    key: "DSA" + Date.now(),
    access: "public",
    priority: "high",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    projectManager: adminId,
    branchId: testBranch._id,
    createdBy: adminId,
    teamMembers: [adminId, userA_Id, userB_Id]
  });

  console.log("Creating 133 canonical tasks (12 parents, 121 children)...");
  const pfx = "ISO" + Date.now();
  const parentDocs = [];
  for (let i = 1; i <= 12; i++) {
    parentDocs.push({
      _id: new mongoose.Types.ObjectId(),
      taskId: `${pfx}-${i}`,
      taskName: `Parent Topic ${i}`,
      taskType: "Task",
      taskPriority: "high",
      projectName: canonicalProject._id,
      branchId: testBranch._id,
      createdBy: adminId,
      parentTask: null,
      status: "todo",
      progress: 0,
      storyPoints: 5,
      taskStartDate: null,
      taskDueDate: null
    });
  }
  const parentTasks = await Task.insertMany(parentDocs);

  const childDocs = [];
  let childIndex = 13;
  for (let i = 0; i < 12; i++) {
    const parent = parentTasks[i];
    const numChildren = i === 11 ? 11 : 10; // Total 12*10 + 1 = 121
    for (let c = 1; c <= numChildren; c++) {
      childDocs.push({
        _id: new mongoose.Types.ObjectId(),
        taskId: `${pfx}-${childIndex++}`,
        taskName: `Child Problem ${parent.taskName} - ${c}`,
        taskType: "Problem",
        taskPriority: "medium",
        projectName: canonicalProject._id,
        branchId: testBranch._id,
        createdBy: adminId,
        parentTask: parent._id,
        status: "todo",
        progress: 0,
        storyPoints: 3,
        taskStartDate: null,
        taskDueDate: null
      });
    }
  }
  const childTasks = await Task.insertMany(childDocs);

  const all133Tasks = [...parentTasks, ...childTasks];
  assert(all133Tasks.length === 133, "Exactly 133 canonical tasks created");

  console.log("\n================================================================================");
  console.log("STAGE 1: Populate Independent Personal Execution State for ADMIN & USER_A");
  console.log("================================================================================");

  // Today string
  const todayStr = new Date().toISOString().split("T")[0];

  // ADMIN: Completes 10 child tasks, logs 5 hours focus time, creates schedule
  const adminProgressDocs = [];
  for (let i = 0; i < 10; i++) {
    const task = childTasks[i];
    adminProgressDocs.push({
      userId: adminUser._id,
      taskId: task._id,
      projectName: canonicalProject._id,
      status: "done",
      progress: 100,
      completedAt: new Date(),
      activityLogs: [{ oldStatus: "todo", currentStatus: "done", date: new Date(), message: "Admin completed task" }]
    });
  }
  await UserTaskProgress.insertMany(adminProgressDocs);

  await FocusSession.create({
    user: adminUser._id,
    task: childTasks[0]._id,
    branchId: testBranch._id,
    duration: 300, // 5 hours (300 minutes)
    date: new Date(),
    startTime: new Date(),
    endTime: new Date()
  });

  await UserArenaSchedule.create({
    userId: adminUser._id,
    projectId: canonicalProject._id,
    startDate: new Date("2026-08-01"),
    endDate: new Date("2026-08-30"),
    tasksPerDay: 5
  });

  // USER_A: Completes 5 DIFFERENT child tasks (indices 10 to 14), logs 2 hours focus time, creates schedule
  const userAProgressDocs = [];
  for (let i = 10; i < 15; i++) {
    const task = childTasks[i];
    userAProgressDocs.push({
      userId: userA._id,
      taskId: task._id,
      projectName: canonicalProject._id,
      status: "done",
      progress: 100,
      completedAt: new Date(),
      activityLogs: [{ oldStatus: "todo", currentStatus: "done", date: new Date(), message: "User A completed task" }]
    });
  }
  await UserTaskProgress.insertMany(userAProgressDocs);

  await FocusSession.create({
    user: userA._id,
    task: childTasks[10]._id,
    branchId: testBranch._id,
    duration: 120, // 2 hours (120 minutes)
    date: new Date(),
    startTime: new Date(),
    endTime: new Date()
  });

  await UserArenaSchedule.create({
    userId: userA._id,
    projectId: canonicalProject._id,
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-09-15"),
    tasksPerDay: 8
  });

  // USER_B: ZERO Execution Records (Never interacted)
  console.log("User B has 0 UserTaskProgress, 0 FocusSession, 0 UserArenaSchedule records");

  console.log("\n================================================================================");
  console.log("STAGE 2: Test Arena Consistency Cards (getProjectConsistencyStats)");
  console.log("================================================================================");

  const adminProjectStats = await AnalyticsService.getProjectConsistencyStats(canonicalProject._id, adminUser._id);
  const userAProjectStats = await AnalyticsService.getProjectConsistencyStats(canonicalProject._id, userA._id);
  const userBProjectStats = await AnalyticsService.getProjectConsistencyStats(canonicalProject._id, userB._id);

  console.log("Admin Arena Stats Count:", adminProjectStats.length);
  console.log("User A Arena Stats Count:", userAProjectStats.length);
  console.log("User B Arena Stats Count:", userBProjectStats.length);

  assert(adminProjectStats.length === 1, "Admin has 1 day with activity");
  assert(adminProjectStats[0].metrics.tasksCompleted === 10, "Admin sees exactly 10 completed tasks");
  assert(adminProjectStats[0].metrics.hoursLogged === 5.0, "Admin sees exactly 5.0 hours focus time");

  assert(userAProjectStats.length === 1, "User A has 1 day with activity");
  assert(userAProjectStats[0].metrics.tasksCompleted === 5, "User A sees exactly 5 completed tasks");
  assert(userAProjectStats[0].metrics.hoursLogged === 2.0, "User A sees exactly 2.0 hours focus time");

  assert(userBProjectStats.length === 0, "User B sees ZERO activity days (clean [] array)");

  console.log("\n================================================================================");
  console.log("STAGE 3: Test Personal Consistency Stats (getUserConsistencyStats)");
  console.log("================================================================================");

  const adminPersonalStats = await AnalyticsService.getUserConsistencyStats(adminUser._id);
  const userAPersonalStats = await AnalyticsService.getUserConsistencyStats(userA._id);
  const userBPersonalStats = await AnalyticsService.getUserConsistencyStats(userB._id);

  assert(adminPersonalStats.length === 1, "Admin personal stats has 1 entry");
  assert(adminPersonalStats[0].metrics.tasksCompleted === 10, "Admin personal completed tasks is 10");

  assert(userAPersonalStats.length === 1, "User A personal stats has 1 entry");
  assert(userAPersonalStats[0].metrics.tasksCompleted === 5, "User A personal completed tasks is 5");

  assert(userBPersonalStats.length === 0, "User B personal stats is cleanly empty ([])");

  console.log("\n================================================================================");
  console.log("STAGE 4: Test Day Activity Breakdown (getDayDetails)");
  console.log("================================================================================");

  const adminDayDetails = await AnalyticsService.getDayDetails(adminUser._id, todayStr, canonicalProject._id, testBranch._id);
  const userADayDetails = await AnalyticsService.getDayDetails(userA._id, todayStr, canonicalProject._id, testBranch._id);
  const userBDayDetails = await AnalyticsService.getDayDetails(userB._id, todayStr, canonicalProject._id, testBranch._id);

  assert(adminDayDetails.completedTasks.length === 10, "Admin sees 10 completed tasks in day modal");
  assert(adminDayDetails.focusSessions.length === 1, "Admin sees 1 focus session in day modal");
  assert(adminDayDetails.summary.totalFocusHours === 5.0, "Admin summary shows 5.0 focus hours");

  assert(userADayDetails.completedTasks.length === 5, "User A sees 5 completed tasks in day modal");
  assert(userADayDetails.focusSessions.length === 1, "User A sees 1 focus session in day modal");
  assert(userADayDetails.summary.totalFocusHours === 2.0, "User A summary shows 2.0 focus hours");

  assert(userBDayDetails.completedTasks.length === 0, "User B sees 0 completed tasks in day modal");
  assert(userBDayDetails.focusSessions.length === 0, "User B sees 0 focus sessions in day modal");
  assert(userBDayDetails.summary.totalFocusHours === 0, "User B summary shows 0 focus hours");

  console.log("\n================================================================================");
  console.log("STAGE 5: Test Project List Overview (getAllProject / completedTasks stats)");
  console.log("================================================================================");

  // Mock req & res for projectController.getAllProject & taskController.getallTasks
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.data = payload;
        if (this.resolve) this.resolve(this);
        return this;
      }
    };
    res.promise = new Promise((resolve) => {
      res.resolve = resolve;
    });
    return res;
  };

  const adminProjectsRes = createMockRes();
  const userAProjectsRes = createMockRes();
  const userBProjectsRes = createMockRes();

  projectController.getAllProject(
    { user: adminUser, branchId: testBranch._id, body: {}, query: {} },
    adminProjectsRes
  );
  await adminProjectsRes.promise;

  projectController.getAllProject(
    { user: userA, branchId: testBranch._id, body: {}, query: {} },
    userAProjectsRes
  );
  await userAProjectsRes.promise;

  projectController.getAllProject(
    { user: userB, branchId: testBranch._id, body: {}, query: {} },
    userBProjectsRes
  );
  await userBProjectsRes.promise;

  const adminP = adminProjectsRes.data.data.find(p => p._id.toString() === canonicalProject._id.toString());
  const userAP = userAProjectsRes.data.data.find(p => p._id.toString() === canonicalProject._id.toString());
  const userBP = userBProjectsRes.data.data.find(p => p._id.toString() === canonicalProject._id.toString());

  assert(adminP.taskStats.total === 133, "Admin sees 133 total canonical tasks in project card");
  assert(adminP.taskStats.completed === 10, "Admin sees 10 completed tasks in project card");

  assert(userAP.taskStats.total === 133, "User A sees 133 total canonical tasks in project card");
  assert(userAP.taskStats.completed === 5, "User A sees 5 completed tasks in project card");

  assert(userBP.taskStats.total === 133, "User B sees 133 total canonical tasks in project card");
  assert(userBP.taskStats.completed === 0, "User B sees 0 completed tasks in project card");

  console.log("\n================================================================================");
  console.log("STAGE 6: Test Arena Tasks Projection (getallTasks)");
  console.log("================================================================================");

  const adminTasksRes = createMockRes();
  const userATasksRes = createMockRes();
  const userBTasksRes = createMockRes();

  taskController.getallTasks(
    { user: adminUser, branchId: testBranch._id, body: { filter: { projectName: canonicalProject._id.toString() } }, query: {} },
    adminTasksRes
  );
  await adminTasksRes.promise;

  taskController.getallTasks(
    { user: userA, branchId: testBranch._id, body: { filter: { projectName: canonicalProject._id.toString() } }, query: {} },
    userATasksRes
  );
  await userATasksRes.promise;

  taskController.getallTasks(
    { user: userB, branchId: testBranch._id, body: { filter: { projectName: canonicalProject._id.toString() } }, query: {} },
    userBTasksRes
  );
  await userBTasksRes.promise;

  const adminTasks = adminTasksRes.data.data;
  const userATasks = userATasksRes.data.data;
  const userBTasks = userBTasksRes.data.data;

  assert(adminTasks.length === 133, "Admin receives all 133 canonical tasks");
  assert(userATasks.length === 133, "User A receives all 133 canonical tasks");
  assert(userBTasks.length === 133, "User B receives all 133 canonical tasks");

  const adminChildDoneCount = adminTasks.filter(t => t.status === "done" && t.parentTask).length;
  const userAChildDoneCount = userATasks.filter(t => t.status === "done" && t.parentTask).length;
  const userBChildDoneCount = userBTasks.filter(t => t.status === "done" && t.parentTask).length;

  assert(adminChildDoneCount === 10, "Admin projected task list has 10 'done' child tasks");
  assert(userAChildDoneCount === 5, "User A projected task list has 5 'done' child tasks");
  assert(userBChildDoneCount === 0, "User B projected task list has 0 'done' child tasks (all 'todo')");

  // Verify dynamic subtaskStats & progress on parent topics
  const adminParent1 = adminTasks.find(t => !t.parentTask && t._id.toString() === parentTasks[0]._id.toString());
  const userAParent1 = userATasks.find(t => !t.parentTask && t._id.toString() === parentTasks[0]._id.toString());
  const userBParent1 = userBTasks.find(t => !t.parentTask && t._id.toString() === parentTasks[0]._id.toString());

  assert(adminParent1.subtaskStats.completed === 10 && adminParent1.progress === 100, "Admin parent topic 1 has 10/10 completed (100%)");
  assert(userAParent1.subtaskStats.completed === 0 && userAParent1.progress === 0, "User A parent topic 1 has 0/10 completed (0%)");
  assert(userBParent1.subtaskStats.completed === 0 && userBParent1.progress === 0, "User B parent topic 1 has 0/10 completed (0%)");

  const userAParent2 = userATasks.find(t => !t.parentTask && t._id.toString() === parentTasks[1]._id.toString());
  assert(userAParent2.subtaskStats.completed === 5 && userAParent2.progress === 50, "User A parent topic 2 has 5/10 completed (50%)");

  console.log("\n================================================================================");
  console.log("STAGE 7: Database Zero-Touch Rule Verification");
  console.log("================================================================================");

  const dbTasks = await Task.find({ projectName: canonicalProject._id });
  const nonTodoCount = dbTasks.filter(t => t.status !== "todo").length;
  const nonNullDatesCount = dbTasks.filter(t => t.taskStartDate !== null || t.taskDueDate !== null).length;

  assert(nonTodoCount === 0, "All 133 canonical master Tasks in DB remain 'todo'");
  assert(nonNullDatesCount === 0, "All 133 canonical master Tasks in DB have null dates");

  // Clean up test data
  console.log("\nCleaning up test data...");
  await UserTaskProgress.deleteMany({ userId: { $in: [adminUser._id, userA._id, userB._id] } });
  await UserArenaSchedule.deleteMany({ userId: { $in: [adminUser._id, userA._id, userB._id] } });
  await FocusSession.deleteMany({ user: { $in: [adminUser._id, userA._id, userB._id] } });
  await Task.deleteMany({ projectName: canonicalProject._id });
  await Project.findByIdAndDelete(canonicalProject._id);
  await Branch.findByIdAndDelete(testBranch._id);

  await mongoose.disconnect();

  console.log("\n================================================================================");
  console.log("🎉 ALL USER EXECUTION ISOLATION TESTS PASSED PERFECTLY!");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
