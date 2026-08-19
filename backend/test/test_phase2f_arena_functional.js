import mongoose from "mongoose";
import tc from "../services/task-service/task.controller.js";
import pc from "../services/project-service/project.controller.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import { UserArenaSchedule } from "../models/userArenaSchedule.model.js";

// Helper to create mock Express Response
const createMockRes = () => {
    const res = {
        statusCode: 200,
        headers: {},
        data: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(payload) {
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

async function runArenaFunctionalTests() {
    console.log("==================================================");
    console.log("   STARTING PHASE 2F REALISTIC ARENA TESTS        ");
    console.log("==================================================");

    // Realistic IDs
    const branch1Id = new mongoose.Types.ObjectId("660000000000000000000010");
    const branch2Id = new mongoose.Types.ObjectId("660000000000000000000099"); // Unauthorized other branch

    const dsaArenaId = new mongoose.Types.ObjectId("660000000000000000000020");
    const otherBranchArenaId = new mongoose.Types.ObjectId("660000000000000000000088");

    const adminId = new mongoose.Types.ObjectId("660000000000000000000001");
    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000003");

    // In-memory Mock Stores
    const projectsDb = [
        {
            _id: dsaArenaId,
            name: "DSA Arena",
            key: "DSA",
            branchId: branch1Id,
            toObject: function() { return { ...this }; }
        },
        {
            _id: otherBranchArenaId,
            name: "Secret Branch Arena",
            key: "SEC",
            branchId: branch2Id,
            toObject: function() { return { ...this }; }
        }
    ];

    // Canonical Parent Topics (Real world shape: NO branchId directly on tasks)
    const parent1Id = new mongoose.Types.ObjectId("660000000000000000000100");
    const parent2Id = new mongoose.Types.ObjectId("660000000000000000000200");

    // Canonical Child Subtasks (Real world shape: branchId is null or undefined)
    const child1A_Id = new mongoose.Types.ObjectId("660000000000000000000101");
    const child1B_Id = new mongoose.Types.ObjectId("660000000000000000000102");
    const child1C_Id = new mongoose.Types.ObjectId("660000000000000000000103");
    const child2A_Id = new mongoose.Types.ObjectId("660000000000000000000201");
    const child2B_Id = new mongoose.Types.ObjectId("660000000000000000000202");

    // Master Tasks in DB (Notice branchId is intentionally null or undefined)
    const tasksDb = [
        {
            _id: parent1Id,
            taskName: "Arrays & Hashing",
            taskId: "DSA-TOPIC-1",
            projectName: dsaArenaId,
            parentTask: null,
            branchId: undefined, // Historically omitted
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: child1A_Id,
            taskName: "Two Sum",
            taskId: "DSA-101",
            projectName: dsaArenaId,
            parentTask: parent1Id,
            branchId: null, // Null in DB
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: child1B_Id,
            taskName: "Three Sum",
            taskId: "DSA-102",
            projectName: dsaArenaId,
            parentTask: parent1Id,
            branchId: undefined,
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: child1C_Id,
            taskName: "Four Sum",
            taskId: "DSA-103",
            projectName: dsaArenaId,
            parentTask: parent1Id,
            branchId: null,
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: parent2Id,
            taskName: "Binary Search",
            taskId: "DSA-TOPIC-2",
            projectName: dsaArenaId,
            parentTask: null,
            branchId: undefined,
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: child2A_Id,
            taskName: "Search in Rotated Sorted Array",
            taskId: "DSA-201",
            projectName: dsaArenaId,
            parentTask: parent2Id,
            branchId: null,
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        },
        {
            _id: child2B_Id,
            taskName: "Find Peak Element",
            taskId: "DSA-202",
            projectName: dsaArenaId,
            parentTask: parent2Id,
            branchId: undefined,
            status: "todo",
            progress: 0,
            taskStartDate: null,
            taskDueDate: null,
            toObject: function() { return { ...this }; }
        }
    ];

    // Task belonging to other branch project
    const otherBranchTaskId = new mongoose.Types.ObjectId("660000000000000000000888");
    tasksDb.push({
        _id: otherBranchTaskId,
        taskName: "Secret Task",
        taskId: "SEC-101",
        projectName: otherBranchArenaId,
        parentTask: null,
        branchId: branch2Id,
        toObject: function() { return { ...this }; }
    });

    let userProgressDb = [];
    let userSchedulesDb = [];

    // Mock Mongoose Query implementations
    Project.find = function(query) {
        let results = projectsDb;
        if (query?.branchId) {
            results = results.filter(p => p.branchId.toString() === query.branchId.toString());
        }
        return {
            select: () => ({
                lean: async () => results.map(p => ({ _id: p._id }))
            }),
            lean: async () => results
        };
    };

    Project.findOne = function(query) {
        let found = projectsDb.find(p => {
            if (query._id && p._id.toString() !== query._id.toString()) return false;
            if (query.branchId && p.branchId.toString() !== query.branchId.toString()) return false;
            return true;
        });
        return {
            select: () => ({
                lean: async () => found ? { _id: found._id } : null
            }),
            lean: async () => found || null
        };
    };

    Project.findById = async function(id) {
        return projectsDb.find(p => p._id.toString() === id.toString()) || null;
    };

    Task.find = function(query) {
        let results = tasksDb.filter(t => {
            if (query.projectName) {
                const targetProjectIds = Array.isArray(query.projectName?.$in) 
                    ? query.projectName.$in.map(id => id.toString())
                    : [query.projectName.toString()];
                if (!targetProjectIds.includes(t.projectName.toString())) return false;
            }
            if (query.$or) {
                const orMatch = query.$or.some(clause => {
                    if (clause.parentTask === null && (t.parentTask === null || t.parentTask === undefined)) return true;
                    if (clause.parentTask?.$exists === false && (t.parentTask === null || t.parentTask === undefined)) return true;
                    if (clause.branchId && t.branchId && t.branchId.toString() === clause.branchId.toString()) return true;
                    if (clause.projectName?.$in) {
                        return clause.projectName.$in.some(pId => pId.toString() === t.projectName.toString());
                    }
                    return false;
                });
                if (!orMatch) return false;
            }
            if (query.parentTask) {
                if (query.parentTask === null) {
                    if (t.parentTask !== null && t.parentTask !== undefined) return false;
                } else if (query.parentTask.$ne === null) {
                    if (t.parentTask === null || t.parentTask === undefined) return false;
                }
            }
            return true;
        });

        return {
            populate: function() { return this; },
            sort: function() { return this; },
            lean: async function() {
                return results.map(t => {
                    let item = { ...t };
                    if (item.parentTask) {
                        const parent = tasksDb.find(p => p._id.toString() === item.parentTask.toString());
                        item.parentTask = parent ? { ...parent } : item.parentTask;
                    }
                    return item;
                });
            }
        };
    };

    Task.findById = function(id) {
        const found = tasksDb.find(t => t._id.toString() === id.toString());
        return {
            populate: function() { return this; },
            lean: async () => found ? { ...found } : null,
            then: async (resolve) => resolve(found ? { ...found, toObject: () => ({ ...found }) } : null)
        };
    };

    UserTaskProgress.find = function(query) {
        let results = userProgressDb.filter(p => {
            if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
            if (query.taskId?.$in) {
                const targetIds = query.taskId.$in.map(id => id.toString());
                return targetIds.includes(p.taskId.toString());
            }
            return true;
        });
        return {
            select: () => ({
                lean: async () => results
            }),
            lean: async () => results
        };
    };

    UserTaskProgress.findOne = function(query) {
        const found = userProgressDb.find(p => {
            if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
            if (query.taskId && p.taskId.toString() !== query.taskId.toString()) return false;
            return true;
        });
        return {
            lean: async () => found ? { ...found } : null,
            then: async (resolve) => resolve(found ? { ...found, toObject: () => ({ ...found }) } : null)
        };
    };

    UserTaskProgress.bulkWrite = async function(ops) {
        for (let op of ops) {
            if (op.updateOne) {
                const { filter, update, upsert } = op.updateOne;
                let existing = userProgressDb.find(p => 
                    p.userId.toString() === filter.userId.toString() && 
                    p.taskId.toString() === filter.taskId.toString()
                );
                if (existing) {
                    if (update.$set) Object.assign(existing, update.$set);
                } else if (upsert) {
                    userProgressDb.push({
                        userId: filter.userId,
                        taskId: filter.taskId,
                        ...(update.$setOnInsert || {}),
                        ...(update.$set || {})
                    });
                }
            }
        }
        return { ok: 1 };
    };

    UserTaskProgress.updateMany = async function(query, update) {
        userProgressDb.forEach(p => {
            if (p.userId.toString() === query.userId.toString() && p.projectName.toString() === query.projectName.toString()) {
                if (update.$unset) {
                    Object.keys(update.$unset).forEach(k => delete p[k]);
                }
            }
        });
        return { acknowledged: true };
    };

    UserArenaSchedule.findOne = async function(query) {
        return userSchedulesDb.find(s => 
            s.userId.toString() === query.userId.toString() && 
            s.projectId.toString() === query.projectId.toString()
        ) || null;
    };

    UserArenaSchedule.findOneAndUpdate = async function(filter, update, options) {
        let existing = userSchedulesDb.find(s => 
            s.userId.toString() === filter.userId.toString() && 
            s.projectId.toString() === filter.projectId.toString()
        );
        if (existing) {
            Object.assign(existing, update);
            return existing;
        }
        userSchedulesDb.push({ ...update });
        return update;
    };

    UserArenaSchedule.findOneAndDelete = async function(query) {
        const idx = userSchedulesDb.findIndex(s => 
            s.userId.toString() === query.userId.toString() && 
            s.projectId.toString() === query.projectId.toString()
        );
        if (idx !== -1) {
            return userSchedulesDb.splice(idx, 1)[0];
        }
        return null;
    };

    // -------------------------------------------------------------
    // TEST 1: Canonical Task Visibility for New User (0 UserTaskProgress)
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: New User Sees Complete Canonical Hierarchy (branchId missing/null) ---");
    {
        const req = {
            user: { _id: userB_Id, email: "userb@example.com" },
            branchId: branch1Id.toString(),
            body: { filter: { projectName: dsaArenaId.toString() } },
            query: {}
        };
        const res = createMockRes();
        await tc.getallTasks(req, res);
        await res.promise;

        const tasks = res.data?.data || [];
        if (tasks.length !== 7) {
            throw new Error(`Test 1 Failed: Expected 7 tasks (2 parents, 5 children), got ${tasks.length}`);
        }

        const parents = tasks.filter(t => !t.parentTask);
        const children = tasks.filter(t => t.parentTask);

        if (parents.length !== 2 || children.length !== 5) {
            throw new Error(`Test 1 Failed: Expected 2 parents & 5 children. Got: ${parents.length} parents, ${children.length} children.`);
        }

        // Verify default clean execution state
        tasks.forEach(t => {
            if (t.status !== "todo" || t.progress !== 0 || t.taskStartDate !== null || t.taskDueDate !== null) {
                throw new Error(`Test 1 Failed: Task ${t.taskName} has dirty initial execution state: status=${t.status}, progress=${t.progress}, dates=${t.taskStartDate}`);
            }
        });

        // Verify parentTask sub-document projection on children
        children.forEach(c => {
            if (typeof c.parentTask === "object" && c.parentTask.status !== "todo") {
                throw new Error(`Test 1 Failed: Child task ${c.taskName} has incorrect parent status: ${c.parentTask.status}`);
            }
        });

        console.log("✅ Test 1 Passed: New user with 0 UserTaskProgress cleanly retrieves all 7 canonical tasks with default todo/0% state.");
    }

    // -------------------------------------------------------------
    // TEST 2: User A Schedules Arena (Custom Timeline Generation)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: User A Configures & Applies Arena Schedule ---");
    {
        const req = {
            user: { _id: userA_Id, email: "usera@example.com" },
            branchId: branch1Id.toString(),
            params: { projectId: dsaArenaId.toString() },
            body: {
                startDate: "2026-08-20",
                tasksPerDay: 3,
                revisionDaysPerParent: 2
            }
        };
        const res = createMockRes();
        await pc.scheduleArena(req, res);
        await res.promise;

        if (res.statusCode !== 200) {
            throw new Error(`Test 2 Failed: Scheduler returned status ${res.statusCode}: ${JSON.stringify(res.data)}`);
        }

        // Verify User A UserArenaSchedule created
        const scheduleA = userSchedulesDb.find(s => s.userId.toString() === userA_Id.toString());
        if (!scheduleA || scheduleA.tasksPerDay !== 3 || scheduleA.revisionDaysPerParent !== 2) {
            throw new Error(`Test 2 Failed: User A schedule not created correctly in DB.`);
        }

        // Verify User A task dates created in UserTaskProgress
        const progressA = userProgressDb.filter(p => p.userId.toString() === userA_Id.toString());
        if (progressA.length !== 7) {
            throw new Error(`Test 2 Failed: Expected 7 UserTaskProgress records for User A, got ${progressA.length}`);
        }

        // Verify User A task retrieval now reflects calculated dates
        const getReq = {
            user: { _id: userA_Id, email: "usera@example.com" },
            branchId: branch1Id.toString(),
            body: { filter: { projectName: dsaArenaId.toString() } },
            query: {}
        };
        const getRes = createMockRes();
        await tc.getallTasks(getReq, getRes);
        await getRes.promise;

        const tasksA = getRes.data?.data || [];
        const scheduledTasks = tasksA.filter(t => t.taskStartDate !== null && t.taskDueDate !== null);
        if (scheduledTasks.length !== 7) {
            throw new Error(`Test 2 Failed: User A projected tasks did not reflect calculated dates. Only ${scheduledTasks.length}/7 have dates.`);
        }

        console.log("✅ Test 2 Passed: User A schedule generated and projected onto User A's task view.");
    }

    // -------------------------------------------------------------
    // TEST 3: User B Opens Same Arena (100% Isolation from User A)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: User B Opens Same Arena with Zero User A Leakage ---");
    {
        const req = {
            user: { _id: userB_Id, email: "userb@example.com" },
            branchId: branch1Id.toString(),
            body: { filter: { projectName: dsaArenaId.toString() } },
            query: {}
        };
        const res = createMockRes();
        await tc.getallTasks(req, res);
        await res.promise;

        const tasksB = res.data?.data || [];
        if (tasksB.length !== 7) {
            throw new Error(`Test 3 Failed: User B should see all 7 tasks, got ${tasksB.length}`);
        }

        // Verify NO dates from User A leaked to User B
        tasksB.forEach(t => {
            if (t.taskStartDate !== null || t.taskDueDate !== null) {
                throw new Error(`Test 3 Failed: User A's schedule date leaked to User B on task ${t.taskName}: ${t.taskStartDate}`);
            }
            if (t.status !== "todo" || t.progress !== 0) {
                throw new Error(`Test 3 Failed: User B status is not todo: ${t.status}`);
            }
        });

        // Verify User B schedule API returns null
        const schedReq = {
            user: { _id: userB_Id, email: "userb@example.com" },
            params: { projectId: dsaArenaId.toString() }
        };
        const schedRes = createMockRes();
        await pc.getArenaSchedule(schedReq, schedRes);
        await schedRes.promise;

        if (schedRes.data?.data?.isScheduled !== false || schedRes.data?.data?.schedule !== null) {
            throw new Error(`Test 3 Failed: User B has a leaked schedule!`);
        }

        console.log("✅ Test 3 Passed: User B sees the exact same canonical tasks with zero dates and zero leakage from User A.");
    }

    // -------------------------------------------------------------
    // TEST 4: User B Creates Independent Schedule
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: User B Creates Independent Schedule ---");
    {
        const req = {
            user: { _id: userB_Id, email: "userb@example.com" },
            branchId: branch1Id.toString(),
            params: { projectId: dsaArenaId.toString() },
            body: {
                startDate: "2026-09-01",
                tasksPerDay: 5,
                revisionDaysPerParent: 1
            }
        };
        const res = createMockRes();
        await pc.scheduleArena(req, res);
        await res.promise;

        const scheduleB = userSchedulesDb.find(s => s.userId.toString() === userB_Id.toString());
        const scheduleA = userSchedulesDb.find(s => s.userId.toString() === userA_Id.toString());

        if (!scheduleB || scheduleB.tasksPerDay !== 5 || scheduleB.revisionDaysPerParent !== 1) {
            throw new Error("Test 4 Failed: User B schedule not created correctly.");
        }
        if (!scheduleA || scheduleA.tasksPerDay !== 3 || scheduleA.revisionDaysPerParent !== 2) {
            throw new Error("Test 4 Failed: User A schedule was mutated when User B created a schedule!");
        }

        console.log("✅ Test 4 Passed: User B created independent schedule; User A schedule remained 100% untouched.");
    }

    // -------------------------------------------------------------
    // TEST 5: Master Task Protection (Zero-Touch Verification)
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Master Task Verification (Zero-Touch Invariant) ---");
    {
        // Verify every master task in tasksDb has never been mutated
        tasksDb.forEach(t => {
            if (t.taskStartDate !== null && t.taskStartDate !== undefined) {
                throw new Error(`Test 5 Failed: Master task ${t.taskName} had taskStartDate mutated: ${t.taskStartDate}`);
            }
            if (t.taskDueDate !== null && t.taskDueDate !== undefined) {
                throw new Error(`Test 5 Failed: Master task ${t.taskName} had taskDueDate mutated: ${t.taskDueDate}`);
            }
        });
        console.log("✅ Test 5 Passed: All master task documents remain 100% canonical and untouched.");
    }

    // -------------------------------------------------------------
    // TEST 6: Branch Security & Unauthorized Project Blocking
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Branch Security (Unauthorized Project Access Blocked) ---");
    {
        // User A is connected to branch1Id, but requests tasks for otherBranchArenaId (which belongs to branch2Id)
        const req = {
            user: { _id: userA_Id, email: "usera@example.com" },
            branchId: branch1Id.toString(),
            body: { filter: { projectName: otherBranchArenaId.toString() } },
            query: {}
        };
        const res = createMockRes();
        await tc.getallTasks(req, res);
        await res.promise;

        if (res.statusCode !== 403) {
            throw new Error(`Test 6 Failed: Expected 403 Forbidden when requesting project from unauthorized branch. Got: ${res.statusCode}`);
        }

        // Test getTaskById for task belonging to other branch
        const taskReq = {
            user: { _id: userA_Id, email: "usera@example.com" },
            branchId: branch1Id.toString(),
            params: { taskId: otherBranchTaskId.toString() }
        };
        const taskRes = createMockRes();
        await tc.getTaskById(taskReq, taskRes);
        await taskRes.promise;

        if (taskRes.statusCode !== 403) {
            throw new Error(`Test 6 Failed: Expected 403 Forbidden for getTaskById across branches. Got: ${taskRes.statusCode}`);
        }

        console.log("✅ Test 6 Passed: Branch boundary securely enforced; unauthorized cross-branch project/task access blocked with 403 Forbidden.");
    }

    // -------------------------------------------------------------
    // TEST 7: Backward Compatibility (filter.projectId remapped to filter.projectName)
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Backward Compatibility with filter.projectId ---");
    {
        const req = {
            user: { _id: userA_Id, email: "usera@example.com" },
            branchId: branch1Id.toString(),
            body: { filter: { projectId: dsaArenaId.toString() } }, // Notice: projectId instead of projectName
            query: {}
        };
        const res = createMockRes();
        await tc.getallTasks(req, res);
        await res.promise;

        const tasks = res.data?.data || [];
        if (tasks.length !== 7) {
            throw new Error(`Test 7 Failed: Expected 7 tasks when sending filter.projectId, got ${tasks.length}`);
        }
        console.log("✅ Test 7 Passed: filter.projectId remapped cleanly to filter.projectName.");
    }

    console.log("\n==================================================");
    console.log("  ALL PHASE 2F ARENA FUNCTIONAL TESTS PASSED! (7/7)");
    console.log("==================================================");
}

runArenaFunctionalTests().catch(err => {
    console.error("FATAL ERROR in Phase 2F Arena Functional Tests:", err);
    process.exit(1);
});
