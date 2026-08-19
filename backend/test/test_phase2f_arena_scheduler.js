import mongoose from "mongoose";
import pc from "../services/project-service/project.controller.js";
import tc from "../services/task-service/task.controller.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { UserArenaSchedule } from "../models/userArenaSchedule.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import moment from "moment";

// Helper for Mock Response
function createMockRes() {
    let _resolve;
    const promise = new Promise((resolve) => {
        _resolve = resolve;
    });
    return {
        promise,
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            _resolve(this);
            return this;
        }
    };
}

// Helper for Query Chaining
function createQueryChain(result) {
    const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        limit: () => query,
        lean: () => Promise.resolve(result),
        then: (resolve) => resolve(result)
    };
    return query;
}

async function runPhase2FTests() {
    console.log("==================================================");
    console.log("    STARTING PHASE 2F ARENA SCHEDULER TESTS       ");
    console.log("==================================================");

    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000001");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const admin_Id = new mongoose.Types.ObjectId("660000000000000000000003");
    const projectId = new mongoose.Types.ObjectId("660000000000000000000020");
    const branchId = new mongoose.Types.ObjectId("660000000000000000000010");

    // Parent Topics
    const parent1Id = new mongoose.Types.ObjectId("660000000000000000000100");
    const parent2Id = new mongoose.Types.ObjectId("660000000000000000000200");

    const masterParentTasks = [
        {
            _id: parent1Id,
            taskName: "Topic 1: Arrays",
            projectName: projectId,
            parentTask: null,
            order: 1,
            taskStartDate: null,
            taskDueDate: null,
            status: "todo"
        },
        {
            _id: parent2Id,
            taskName: "Topic 2: Strings",
            projectName: projectId,
            parentTask: null,
            order: 2,
            taskStartDate: null,
            taskDueDate: null,
            status: "todo"
        }
    ];

    // Child Tasks: 8 in Topic 1, 8 in Topic 2
    const masterChildTasks = [];
    for (let i = 1; i <= 8; i++) {
        masterChildTasks.push({
            _id: new mongoose.Types.ObjectId(`66000000000000000000010${i}`),
            taskName: `Array Problem ${i}`,
            projectName: projectId,
            parentTask: parent1Id,
            order: i,
            taskStartDate: null,
            taskDueDate: null,
            status: "todo"
        });
    }
    for (let i = 1; i <= 8; i++) {
        masterChildTasks.push({
            _id: new mongoose.Types.ObjectId(`66000000000000000000020${i}`),
            taskName: `String Problem ${i}`,
            projectName: projectId,
            parentTask: parent2Id,
            order: i,
            taskStartDate: null,
            taskDueDate: null,
            status: "todo"
        });
    }

    const allMasterTasks = [...masterParentTasks, ...masterChildTasks];

    // In-memory stores
    let userProgressDb = [];
    let userScheduleDb = [];

    // Mock Models
    const origProjectFindById = Project.findById;
    const origTaskFind = Task.find;
    const origScheduleFindOne = UserArenaSchedule.findOne;
    const origScheduleFindOneAndUpdate = UserArenaSchedule.findOneAndUpdate;
    const origScheduleFindOneAndDelete = UserArenaSchedule.findOneAndDelete;
    const origProgressFind = UserTaskProgress.find;
    const origProgressBulkWrite = UserTaskProgress.bulkWrite;
    const origProgressUpdateMany = UserTaskProgress.updateMany;

    Project.findById = (id) => {
        if (id.toString() === projectId.toString()) {
            return createQueryChain({
                _id: projectId,
                name: "DSA Coding Arena",
                key: "DSA",
                branchId: branchId
            });
        }
        return createQueryChain(null);
    };

    Task.find = (query) => {
        let results = [...allMasterTasks];
        if (query.projectName) {
            results = results.filter(t => t.projectName.toString() === query.projectName.toString());
        }
        if (query.$or) {
            results = results.filter(t => {
                return query.$or.some(clause => {
                    if (clause.parentTask === null && (t.parentTask === null || t.parentTask === undefined)) return true;
                    if (clause.parentTask?.$exists === false && (t.parentTask === null || t.parentTask === undefined)) return true;
                    return false;
                });
            });
        }
        if (query.parentTask) {
            if (query.parentTask === null) {
                results = results.filter(t => t.parentTask === null || t.parentTask === undefined);
            } else if (query.parentTask.$ne !== undefined) {
                results = results.filter(t => t.parentTask !== null && t.parentTask !== undefined);
            }
        }
        return createQueryChain(results);
    };

    UserArenaSchedule.findOne = (query) => {
        const doc = userScheduleDb.find(s =>
            s.userId.toString() === query.userId.toString() &&
            s.projectId.toString() === query.projectId.toString()
        );
        return createQueryChain(doc || null);
    };

    UserArenaSchedule.findOneAndUpdate = (query, update, options) => {
        let doc = userScheduleDb.find(s =>
            s.userId.toString() === query.userId.toString() &&
            s.projectId.toString() === query.projectId.toString()
        );
        if (!doc && options?.upsert) {
            doc = { _id: new mongoose.Types.ObjectId(), ...update };
            userScheduleDb.push(doc);
        } else if (doc) {
            Object.assign(doc, update);
        }
        return createQueryChain(doc);
    };

    UserArenaSchedule.findOneAndDelete = (query) => {
        const idx = userScheduleDb.findIndex(s =>
            s.userId.toString() === query.userId.toString() &&
            s.projectId.toString() === query.projectId.toString()
        );
        if (idx !== -1) {
            const removed = userScheduleDb.splice(idx, 1)[0];
            return createQueryChain(removed);
        }
        return createQueryChain(null);
    };

    UserTaskProgress.find = (query) => {
        const matches = userProgressDb.filter(p => {
            if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
            if (query.taskId?.$in) {
                const inIds = query.taskId.$in.map(id => id.toString());
                if (!inIds.includes(p.taskId.toString())) return false;
            }
            return true;
        });
        return createQueryChain(matches);
    };

    UserTaskProgress.bulkWrite = (ops) => {
        ops.forEach(op => {
            if (op.updateOne) {
                const { filter, update, upsert } = op.updateOne;
                let record = userProgressDb.find(p =>
                    p.userId.toString() === filter.userId.toString() &&
                    p.taskId.toString() === filter.taskId.toString()
                );
                if (!record && upsert) {
                    record = {
                        _id: new mongoose.Types.ObjectId(),
                        userId: filter.userId,
                        taskId: filter.taskId,
                        ...(update.$setOnInsert || {}),
                        ...(update.$set || {})
                    };
                    userProgressDb.push(record);
                } else if (record && update.$set) {
                    Object.assign(record, update.$set);
                }
            }
        });
        return Promise.resolve({ ok: 1, modifiedCount: ops.length });
    };

    UserTaskProgress.updateMany = (filter, update) => {
        userProgressDb.forEach(p => {
            if (filter.userId && p.userId.toString() === filter.userId.toString() &&
                filter.projectName && p.projectName.toString() === filter.projectName.toString()) {
                if (update.$unset) {
                    Object.keys(update.$unset).forEach(k => delete p[k]);
                }
            }
        });
        return Promise.resolve({ ok: 1 });
    };

    // -------------------------------------------------------------
    // TEST A: User A Applies Schedule (4 tasks/day, 2 revision buffer days)
    // -------------------------------------------------------------
    console.log("\n--- TEST A: User A Schedule Generation & Timeline Calculation ---");
    {
        const req = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            params: { projectId: projectId.toString() },
            body: {
                startDate: "2026-08-15",
                tasksPerDay: 4,
                revisionDaysPerParent: 2
            },
            branchId: branchId.toString()
        };
        const res = createMockRes();
        await pc.scheduleArena(req, res);
        await res.promise;

        const data = res.data.data;
        if (data.totalTasks !== 16 || data.totalParentTasks !== 2 || data.calculatedTotalDays !== 6) {
            throw new Error(`Test A Failed: Expected 16 child tasks, 2 parents, 6 total days. Got: ${JSON.stringify(data)}`);
        }
        if (userScheduleDb.length !== 1 || userScheduleDb[0].userId.toString() !== userA_Id.toString()) {
            throw new Error("Test A Failed: UserArenaSchedule record was not created with User A ownership.");
        }

        // Verify task dates in UserTaskProgress
        const p1_child1 = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === masterChildTasks[0]._id.toString());
        const p1_child8 = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === masterChildTasks[7]._id.toString());
        const p2_child1 = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === masterChildTasks[8]._id.toString());

        if (moment.utc(p1_child1.taskStartDate).format("YYYY-MM-DD") !== "2026-08-15") {
            throw new Error(`Test A Failed: P1 Child 1 start date expected 2026-08-15, got ${p1_child1.taskStartDate}`);
        }
        if (moment.utc(p1_child8.taskStartDate).format("YYYY-MM-DD") !== "2026-08-16") {
            throw new Error(`Test A Failed: P1 Child 8 start date expected 2026-08-16, got ${p1_child8.taskStartDate}`);
        }
        // Topic 1 finishes 2026-08-16 + 2 revision buffer days (17, 18) -> Topic 2 starts 2026-08-19
        if (moment.utc(p2_child1.taskStartDate).format("YYYY-MM-DD") !== "2026-08-19") {
            throw new Error(`Test A Failed: P2 Child 1 start date expected 2026-08-19 (after 2 revision buffer days), got ${p2_child1.taskStartDate}`);
        }

        console.log("✅ Test A Passed: User A schedule generated accurately with 4 tasks/day and 2 revision buffer days.");
    }

    // -------------------------------------------------------------
    // TEST B: User B Unscheduled Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST B: User B Unscheduled Cross-User Isolation ---");
    {
        // 1. User B checks schedule
        const reqSchedB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            params: { projectId: projectId.toString() }
        };
        const resSchedB = createMockRes();
        await pc.getArenaSchedule(reqSchedB, resSchedB);
        await resSchedB.promise;

        if (resSchedB.data.data.isScheduled !== false || resSchedB.data.data.schedule !== null) {
            throw new Error("Test B1 Failed: User B leaked User A's UserArenaSchedule!");
        }

        // 2. User B reads tasks via TaskController
        const reqTasksB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            query: {},
            body: { filter: { projectName: projectId.toString() } }
        };
        const resTasksB = createMockRes();
        await tc.getallTasks(reqTasksB, resTasksB);
        await resTasksB.promise;

        const tasksB = resTasksB.data.data;
        const scheduledTasksForB = tasksB.filter(t => t.taskStartDate !== null || t.taskDueDate !== null);
        if (scheduledTasksForB.length > 0) {
            throw new Error("Test B2 Failed: User B leaked User A's task dates!");
        }

        console.log("✅ Test B Passed: User B has 0 schedule and 0 task dates; User A dates are 100% isolated.");
    }

    // -------------------------------------------------------------
    // TEST C: Target Duration Validation
    // -------------------------------------------------------------
    console.log("\n--- TEST C: Target Duration Validation ---");
    {
        // Attempt to schedule 16 tasks with 1 task/day + 20 buffer days in 1 month (impossible)
        const reqInvalid = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            params: { projectId: projectId.toString() },
            body: {
                startDate: "2026-08-15",
                tasksPerDay: 1,
                revisionDaysPerParent: 20,
                targetMonths: 1 // 30 days max, but will take ~36+ days
            },
            branchId: branchId.toString()
        };
        const resInvalid = createMockRes();
        await pc.scheduleArena(reqInvalid, resInvalid);
        await resInvalid.promise;

        if (resInvalid.statusCode !== 400 || !resInvalid.data?.message?.includes("is insufficient")) {
            throw new Error(`Test C Failed: Infeasible schedule was not rejected! StatusCode: ${resInvalid.statusCode}`);
        }
        console.log("✅ Test C Passed: Infeasible target duration rejected with clear 400 validation error.");
    }

    // -------------------------------------------------------------
    // TEST D: Existing Execution State Preservation
    // -------------------------------------------------------------
    console.log("\n--- TEST D: Existing Execution State Preservation ---");
    {
        // Mark Task 1 as 'done' with progress 100 for User A
        const task1Id = masterChildTasks[0]._id;
        const progressA = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === task1Id.toString());
        progressA.status = "done";
        progressA.progress = 100;
        progressA.activityLogs = [{ action: "completed", timestamp: new Date() }];

        // Re-run schedule for User A (e.g. shift start date to 2026-09-01)
        const reqReschedule = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            params: { projectId: projectId.toString() },
            body: {
                startDate: "2026-09-01",
                tasksPerDay: 4,
                revisionDaysPerParent: 2
            },
            branchId: branchId.toString()
        };
        const resReschedule = createMockRes();
        await pc.scheduleArena(reqReschedule, resReschedule);
        await resReschedule.promise;

        const updatedProgressA = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === task1Id.toString());
        if (updatedProgressA.status !== "done" || updatedProgressA.progress !== 100 || updatedProgressA.activityLogs.length !== 1) {
            throw new Error(`Test D Failed: Scheduling accidentally reset execution state! Got status=${updatedProgressA.status}, progress=${updatedProgressA.progress}`);
        }
        if (moment.utc(updatedProgressA.taskStartDate).format("YYYY-MM-DD") !== "2026-09-01") {
            throw new Error(`Test D Failed: Task 1 start date was not updated to 2026-09-01! Got ${updatedProgressA.taskStartDate}`);
        }

        console.log("✅ Test D Passed: Re-scheduling updated dates while preserving status='done' and 100% progress.");
    }

    // -------------------------------------------------------------
    // TEST E: Schedule Replacement & Idempotency
    // -------------------------------------------------------------
    console.log("\n--- TEST E: Schedule Replacement & Idempotency ---");
    {
        // Verify User A still has exactly 1 schedule document in DB
        const userASchedules = userScheduleDb.filter(s => s.userId.toString() === userA_Id.toString());
        if (userASchedules.length !== 1) {
            throw new Error(`Test E Failed: Expected 1 schedule record for User A, found ${userASchedules.length}`);
        }
        console.log("✅ Test E Passed: Re-running schedule is idempotent and creates zero duplicate records.");
    }

    // -------------------------------------------------------------
    // TEST F: Admin Personal Schedule vs Master Curriculum
    // -------------------------------------------------------------
    console.log("\n--- TEST F: Admin Personal Schedule vs Master Curriculum ---");
    {
        const reqAdmin = {
            user: { _id: admin_Id, id: admin_Id.toString(), email: "balajiaadi2000@gmail.com", role: "admin" },
            params: { projectId: projectId.toString() },
            body: {
                startDate: "2026-10-01",
                tasksPerDay: 8,
                revisionDaysPerParent: 1
            },
            branchId: branchId.toString()
        };
        const resAdmin = createMockRes();
        await pc.scheduleArena(reqAdmin, resAdmin);
        await resAdmin.promise;

        const adminSchedule = userScheduleDb.find(s => s.userId.toString() === admin_Id.toString());
        if (!adminSchedule || moment.utc(adminSchedule.startDate).format("YYYY-MM-DD") !== "2026-10-01") {
            throw new Error("Test F1 Failed: Admin schedule was not saved to Admin's UserArenaSchedule!");
        }

        // Verify Master Task dates remain null
        const masterT1 = allMasterTasks.find(t => t._id.toString() === masterChildTasks[0]._id.toString());
        if (masterT1.taskStartDate !== null || masterT1.taskDueDate !== null) {
            throw new Error("Test F2 Failed: Master Task was mutated with execution dates!");
        }

        console.log("✅ Test F Passed: Admin personal schedule saved to Admin UserArenaSchedule; Master Task remains canonical.");
    }

    // -------------------------------------------------------------
    // TEST G: Schedule Reset API
    // -------------------------------------------------------------
    console.log("\n--- TEST G: Schedule Reset API ---");
    {
        const reqReset = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            params: { projectId: projectId.toString() }
        };
        const resReset = createMockRes();
        await pc.resetArenaSchedule(reqReset, resReset);
        await resReset.promise;

        const scheduleAfterReset = userScheduleDb.find(s => s.userId.toString() === userA_Id.toString());
        if (scheduleAfterReset) {
            throw new Error("Test G Failed: UserArenaSchedule record was not deleted on reset!");
        }

        const task1AfterReset = userProgressDb.find(p => p.userId.toString() === userA_Id.toString() && p.taskId.toString() === masterChildTasks[0]._id.toString());
        if (task1AfterReset.taskStartDate !== undefined || task1AfterReset.taskDueDate !== undefined) {
            throw new Error("Test G Failed: Dates were not unset in UserTaskProgress on reset!");
        }

        console.log("✅ Test G Passed: Schedule reset cleanly removed UserArenaSchedule and unset user task dates.");
    }

    // Restore original functions
    Project.findById = origProjectFindById;
    Task.find = origTaskFind;
    UserArenaSchedule.findOne = origScheduleFindOne;
    UserArenaSchedule.findOneAndUpdate = origScheduleFindOneAndUpdate;
    UserArenaSchedule.findOneAndDelete = origScheduleFindOneAndDelete;
    UserTaskProgress.find = origProgressFind;
    UserTaskProgress.bulkWrite = origProgressBulkWrite;
    UserTaskProgress.updateMany = origProgressUpdateMany;

    console.log("\n==================================================");
    console.log("    ALL PHASE 2F ARENA SCHEDULER TESTS PASSED (7/7)");
    console.log("==================================================");
}

runPhase2FTests().catch(err => {
    console.error("\n❌ Phase 2F Test Failure:", err);
    process.exit(1);
});
