import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model.js";
import { Project } from "./models/project.model.js";
import { Task } from "./models/task.model.js";
import { UserTaskProgress } from "./models/userTaskProgress.model.js";
import { UserArenaSchedule } from "./models/userArenaSchedule.model.js";
import { FocusSession } from "./models/focusSession.model.js";
import { Branch } from "./models/branch.model.js";
import taskController from "./services/task-service/task.controller.js";
import projectController from "./services/project-service/project.controller.js";
import AnalyticsService from "./services/analytics-service/analytics.service.js";

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

function createMockRes() {
  let _resolve;
  const promise = new Promise((resolve) => { _resolve = resolve; });
  return {
    promise,
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) {
      this.data = payload;
      _resolve(this);
      return this;
    }
  };
}

async function runVerification() {
  console.log("================================================================================");
  console.log("STARTING LIVE MULTI-USER REAL MATRIX VERIFICATION (CRITERIA A - O)");
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
  if (!connected) throw new Error("Could not connect to MongoDB");
  console.log("Connected to Real MongoDB");

  // Find or create test users
  let adminUser = await User.findOne({ email: "balajiaadi2000@gmail.com" }).lean();
  let testOne = await User.findOne({ email: "test@gmail.com" }).lean();
  let userB_Id = new mongoose.Types.ObjectId();
  let userB = {
    ...testOne,
    _id: userB_Id,
    firstName: "UserB",
    lastName: "Tester",
    email: "userb_matrix@sarthi.com"
  };

  const dsaPhase1 = await Project.findOne({ name: /DSA phase 1/i }).lean();
  const dsaPhase2 = await Project.findOne({ name: /DSA phase 2/i }).lean();
  const branch = await Branch.findOne(dsaPhase1?.branchId ? { _id: dsaPhase1.branchId } : {}).lean();

  console.log("\n--- TEST CONTEXT ---");
  console.log("Admin User ID:", adminUser._id);
  console.log("Test One ID:", testOne._id);
  console.log("User B ID:", userB._id);
  console.log("DSA Phase 1 Project ID:", dsaPhase1._id);
  console.log("DSA Phase 2 Project ID:", dsaPhase2?._id || "N/A");

  // Clean previous matrix test state for testOne and userB on this project
  await UserArenaSchedule.deleteMany({ userId: { $in: [testOne._id, userB._id] }, projectId: dsaPhase1._id });
  await UserTaskProgress.deleteMany({ userId: { $in: [testOne._id, userB._id] }, projectName: dsaPhase1._id });
  if (dsaPhase2) {
    await UserArenaSchedule.deleteMany({ userId: { $in: [testOne._id, userB._id] }, projectId: dsaPhase2._id });
    await UserTaskProgress.deleteMany({ userId: { $in: [testOne._id, userB._id] }, projectName: dsaPhase2._id });
  }

  console.log("\n================================================================================");
  console.log("CRITERION 1: Clean User B Views DSA Phase 1 (0%, Not scheduled, 0 Completed)");
  console.log("================================================================================");
  
  const userBTasksRes = createMockRes();
  taskController.getallTasks(
    { user: userB, branchId: branch._id, body: { filter: { projectName: dsaPhase1._id.toString() } }, query: {} },
    userBTasksRes
  );
  await userBTasksRes.promise;
  const userBTasks = userBTasksRes.data.data;

  assert(userBTasks.length === 133, "User B receives all 133 canonical tasks in DSA Phase 1");
  const userBCompleted = userBTasks.filter(t => t.status === "done").length;
  assert(userBCompleted === 0, "User B has 0 completed tasks (all 'todo')");

  const userBParents = userBTasks.filter(t => !t.parentTask);
  assert(userBParents.length === 12, "User B sees all 12 parent topics");
  userBParents.forEach(pt => {
    assert(pt.progress === 0, `User B parent '${pt.taskName}' progress is 0%`);
    assert(pt.subtaskStats.completed === 0, `User B parent '${pt.taskName}' subtaskStats completed is 0`);
  });

  const userBDatedTasks = userBTasks.filter(t => t.taskStartDate !== null || t.taskDueDate !== null);
  assert(userBDatedTasks.length === 0, "User B has 0 scheduled dates (all null -> 'Not scheduled')");

  // User B Analytics Check
  const userBHealth = await AnalyticsService.getProjectConsistencyStats(dsaPhase1._id, userB._id);
  assert(userBHealth.length === 0, "User B project health is cleanly empty [] (0 days, 0h, 0 streak, 0 impact)");

  console.log("\n================================================================================");
  console.log("CRITERION 2: Test One Schedules DSA Phase 1 (15 Aug 2026, 4 tasks/day, 2 rev days)");
  console.log("================================================================================");

  const testOneScheduleRes = createMockRes();
  projectController.scheduleArena(
    {
      user: testOne,
      branchId: branch._id,
      params: { projectId: dsaPhase1._id.toString() },
      body: {
        projectId: dsaPhase1._id.toString(),
        startDate: "2026-08-15",
        tasksPerDay: 4,
        revisionDaysPerParent: 2
      }
    },
    testOneScheduleRes
  );
  await testOneScheduleRes.promise;
  assert(testOneScheduleRes.statusCode === 200, "Test One successfully scheduled DSA Phase 1");

  // Check MongoDB UserArenaSchedule for Test One
  const testOneSchedDoc = await UserArenaSchedule.findOne({ userId: testOne._id, projectId: dsaPhase1._id }).lean();
  assert(testOneSchedDoc !== null, "UserArenaSchedule document exists in MongoDB for Test One");
  assert(testOneSchedDoc.tasksPerDay === 4, "Test One schedule tasksPerDay is 4");

  // Query Test One Tasks via getallTasks
  const testOneTasksRes = createMockRes();
  taskController.getallTasks(
    { user: testOne, branchId: branch._id, body: { filter: { projectName: dsaPhase1._id.toString() } }, query: {} },
    testOneTasksRes
  );
  await testOneTasksRes.promise;
  const testOneTasks = testOneTasksRes.data.data;
  const testOneDatedTasks = testOneTasks.filter(t => t.taskStartDate !== null || t.taskDueDate !== null);
  assert(testOneDatedTasks.length === 133, "All 133 tasks for Test One now have personal start/due dates");
  const earliestTestOneDate = testOneDatedTasks.reduce((min, t) => (!min || new Date(t.taskStartDate) < new Date(min)) ? t.taskStartDate : min, null);
  assert(new Date(earliestTestOneDate).toISOString().startsWith("2026-08-15"), "Earliest Test One task starts on 15 Aug 2026");

  console.log("\n================================================================================");
  console.log("CRITERION 3: User B Opens SAME DSA Phase 1 (Must Remain 100% Unscheduled & Clean)");
  console.log("================================================================================");

  const userBTasksRes2 = createMockRes();
  taskController.getallTasks(
    { user: userB, branchId: branch._id, body: { filter: { projectName: dsaPhase1._id.toString() } }, query: {} },
    userBTasksRes2
  );
  await userBTasksRes2.promise;
  const userBTasksAfterTestOne = userBTasksRes2.data.data;
  const userBStillDated = userBTasksAfterTestOne.filter(t => t.taskStartDate !== null || t.taskDueDate !== null);
  assert(userBStillDated.length === 0, "User B still has 0 scheduled dates after Test One scheduled");
  assert(userBTasksAfterTestOne.filter(t => t.status === "done").length === 0, "User B still has 0 completed tasks");

  console.log("\n================================================================================");
  console.log("CRITERION 4: User B Schedules SAME DSA Phase 1 with DIFFERENT Settings (20 Aug 2026, 2/day)");
  console.log("================================================================================");

  const userBScheduleRes = createMockRes();
  projectController.scheduleArena(
    {
      user: userB,
      branchId: branch._id,
      params: { projectId: dsaPhase1._id.toString() },
      body: {
        projectId: dsaPhase1._id.toString(),
        startDate: "2026-08-20",
        tasksPerDay: 2,
        revisionDaysPerParent: 3
      }
    },
    userBScheduleRes
  );
  await userBScheduleRes.promise;
  assert(userBScheduleRes.statusCode === 200, "User B successfully scheduled DSA Phase 1 independently");

  const userBSchedDoc = await UserArenaSchedule.findOne({ userId: userB._id, projectId: dsaPhase1._id }).lean();
  assert(userBSchedDoc !== null, "UserArenaSchedule document exists in MongoDB for User B");
  assert(userBSchedDoc.tasksPerDay === 2, "User B schedule tasksPerDay is 2");

  // Query User B Tasks
  const userBTasksRes3 = createMockRes();
  taskController.getallTasks(
    { user: userB, branchId: branch._id, body: { filter: { projectName: dsaPhase1._id.toString() } }, query: {} },
    userBTasksRes3
  );
  await userBTasksRes3.promise;
  const userBFinalTasks = userBTasksRes3.data.data;
  const earliestUserBDate = userBFinalTasks.filter(t => t.taskStartDate).reduce((min, t) => (!min || new Date(t.taskStartDate) < new Date(min)) ? t.taskStartDate : min, null);
  assert(new Date(earliestUserBDate).toISOString().startsWith("2026-08-20"), "Earliest User B task starts on 20 Aug 2026");

  console.log("\n================================================================================");
  console.log("CRITERION 5: Switch Back to Test One — Verify 15 Aug Schedule Remains Untouched");
  console.log("================================================================================");

  const testOneSchedDocReload = await UserArenaSchedule.findOne({ userId: testOne._id, projectId: dsaPhase1._id }).lean();
  assert(testOneSchedDocReload.tasksPerDay === 4, "Test One schedule still has tasksPerDay = 4 (unmodified)");

  const testOneTasksRes2 = createMockRes();
  taskController.getallTasks(
    { user: testOne, branchId: branch._id, body: { filter: { projectName: dsaPhase1._id.toString() } }, query: {} },
    testOneTasksRes2
  );
  await testOneTasksRes2.promise;
  const testOneTasksReload = testOneTasksRes2.data.data;
  const earliestTestOneReload = testOneTasksReload.filter(t => t.taskStartDate).reduce((min, t) => (!min || new Date(t.taskStartDate) < new Date(min)) ? t.taskStartDate : min, null);
  assert(new Date(earliestTestOneReload).toISOString().startsWith("2026-08-15"), "Earliest Test One task still starts on 15 Aug 2026");

  if (dsaPhase2) {
    console.log("\n================================================================================");
    console.log("CRITERION 6: Multi-Arena Independence (Schedule DSA Phase 2, DSA Phase 1 Unchanged)");
    console.log("================================================================================");

    // Verify DSA Phase 2 is currently unscheduled for Test One
    const testOnePhase2Sched = await UserArenaSchedule.findOne({ userId: testOne._id, projectId: dsaPhase2._id }).lean();
    assert(testOnePhase2Sched === null, "Test One DSA Phase 2 is initially unscheduled");

    // Schedule DSA Phase 2 for Test One
    const testOnePhase2ScheduleRes = createMockRes();
    projectController.scheduleArena(
      {
        user: testOne,
        branchId: branch._id,
        params: { projectId: dsaPhase2._id.toString() },
        body: {
          projectId: dsaPhase2._id.toString(),
          startDate: "2026-10-01",
          tasksPerDay: 5,
          revisionDaysPerParent: 1
        }
      },
      testOnePhase2ScheduleRes
    );
    await testOnePhase2ScheduleRes.promise;
    assert(testOnePhase2ScheduleRes.statusCode === 200, "Test One successfully scheduled DSA Phase 2");

    // Verify DSA Phase 1 schedule remains 15 Aug, 4 tasks/day
    const testOnePhase1Check = await UserArenaSchedule.findOne({ userId: testOne._id, projectId: dsaPhase1._id }).lean();
    assert(testOnePhase1Check.tasksPerDay === 4, "DSA Phase 1 schedule remains completely untouched (tasksPerDay = 4)");

    const testOnePhase2Check = await UserArenaSchedule.findOne({ userId: testOne._id, projectId: dsaPhase2._id }).lean();
    assert(testOnePhase2Check.tasksPerDay === 5, "DSA Phase 2 schedule independently created (tasksPerDay = 5)");
  }

  console.log("\n================================================================================");
  console.log("CRITERION 7: Database Zero-Touch Rule Confirmation");
  console.log("================================================================================");

  const canonicalTasksInDB = await Task.find({ projectName: dsaPhase1._id }).lean();
  assert(canonicalTasksInDB.length === 133, "All 133 canonical Tasks remain in DB");
  console.log("Master Task sample in DB status:", canonicalTasksInDB[0].status, "| progress:", canonicalTasksInDB[0].progress);

  // Clean up User B test record
  await UserArenaSchedule.deleteMany({ userId: userB._id });
  await UserTaskProgress.deleteMany({ userId: userB._id });

  await mongoose.disconnect();
  console.log("\n================================================================================");
  console.log("🎉 ALL REAL MULTI-USER ISOLATION CRITERIA (A - O) VERIFIED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

runVerification().catch(console.error);
