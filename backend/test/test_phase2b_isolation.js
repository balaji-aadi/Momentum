import mongoose from "mongoose";
import tc from "../services/task-service/task.controller.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";

// Helper to create mock response object with Promise resolution
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

async function runPhase2BTests() {
    console.log("==================================================");
    console.log("       STARTING PHASE 2B ISOLATION TESTS          ");
    console.log("==================================================");

    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000001");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const admin_Id = new mongoose.Types.ObjectId("660000000000000000000003");
    const branchId = new mongoose.Types.ObjectId("660000000000000000000010");
    const projectId = new mongoose.Types.ObjectId("660000000000000000000020");
    const taskId1 = new mongoose.Types.ObjectId("660000000000000000000101");

    // Mock Project
    Project.find = () => ({
        select: () => ({
            lean: async () => [{ _id: projectId }]
        }),
        lean: async () => [{ _id: projectId, branchId }]
    });
    Project.findOne = () => ({
        select: () => ({
            lean: async () => ({ _id: projectId })
        }),
        lean: async () => ({ _id: projectId, branchId })
    });
    Project.findById = async () => ({ _id: projectId, branchId });

    // Canonical Master Task Mock
    const mockMasterTask = {
        _id: taskId1,
        taskId: "DSA-101",
        taskName: "Two Sum Problem",
        taskDescription: "Find two indices that sum to target",
        taskPriority: "high",
        taskType: "DSA",
        projectName: projectId,
        branchId: branchId,
        status: "todo",
        progress: 0,
        taskStartDate: null,
        taskDueDate: null,
        estimatedHours: 2,
        attachments: ["https://example.com/twosum.pdf"],
        youtubeUrl: "https://youtube.com/watch?v=twosum",
        createdBy: admin_Id,
        createdAt: new Date("2026-01-01"),
        activityLogs: [],
        toObject() { return { ...this }; }
    };

    Task.findById = () => createQueryChain({ ...mockMasterTask });

    // User A Progress Mock (User A completed Task 1)
    const mockUserAProgress = {
        _id: new mongoose.Types.ObjectId(),
        userId: userA_Id,
        taskId: taskId1,
        projectName: projectId,
        branchId: branchId,
        status: "done",
        progress: 100,
        taskStartDate: new Date("2026-08-01"),
        taskDueDate: new Date("2026-08-05"),
        completedAt: new Date("2026-08-05"),
        activityLogs: [
            { oldStatus: "todo", currentStatus: "done", date: new Date("2026-08-05"), message: "Completed" }
        ],
        revisionLogs: []
    };

    // Helper for Query Chaining
    function createQueryChain(result) {
        const query = {
            select: () => query,
            populate: () => query,
            sort: () => query,
            lean: () => Promise.resolve(result),
            then: (resolve) => resolve(result)
        };
        return query;
    }

    // -------------------------------------------------------------
    // TEST 1: Task Read Projection - getTaskById
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: getTaskById Read-Projection ---");
    {
        const originalTaskFindOne = Task.findOne;
        const originalProgressFindOne = UserTaskProgress.findOne;

        Task.findOne = () => createQueryChain({ ...mockMasterTask });
        Task.findById = () => createQueryChain({ ...mockMasterTask });
        Task.find = () => createQueryChain([]);

        // Scenario 1A: User A queries Task 1
        UserTaskProgress.findOne = ({ userId, taskId }) => {
            if (userId.toString() === userA_Id.toString() && taskId.toString() === taskId1.toString()) {
                return { lean: () => Promise.resolve({ ...mockUserAProgress }) };
            }
            return { lean: () => Promise.resolve(null) };
        };

        const reqUserA = {
            params: { taskId: taskId1.toString() },
            user: { _id: userA_Id, email: "userA@sarthi.com" },
            branchId: branchId.toString()
        };
        const resUserA = createMockRes();
        tc.getTaskById(reqUserA, resUserA);
        await resUserA.promise;

        if (resUserA.data.data.status !== "done" || resUserA.data.data.progress !== 100) {
            throw new Error(`Test 1A Failed: Expected User A status 'done' (100%), got ${resUserA.data.data.status}`);
        }
        if (!resUserA.data.data.taskStartDate || !resUserA.data.data.taskDueDate) {
            throw new Error("Test 1A Failed: Expected custom dates for User A");
        }
        console.log("✅ Test 1A Passed: User A retrieves 'done' with 100% progress and custom dates.");

        // Scenario 1B: User B (new user) queries Task 1
        const reqUserB = {
            params: { taskId: taskId1.toString() },
            user: { _id: userB_Id, email: "userB@sarthi.com" },
            branchId: branchId.toString()
        };
        const resUserB = createMockRes();
        tc.getTaskById(reqUserB, resUserB);
        await resUserB.promise;

        if (resUserB.data.data.status !== "todo" || resUserB.data.data.progress !== 0) {
            throw new Error(`Test 1B Failed: Expected User B status 'todo' (0%), got ${resUserB.data.data.status}`);
        }
        if (resUserB.data.data.taskStartDate !== null || resUserB.data.data.taskDueDate !== null) {
            throw new Error("Test 1B Failed: Expected null dates for new User B");
        }
        if (resUserB.data.data.taskName !== "Two Sum Problem") {
            throw new Error("Test 1B Failed: Expected canonical task name 'Two Sum Problem'");
        }
        console.log("✅ Test 1B Passed: User B cleanly defaults to 'todo' with 0% progress and null dates while seeing canonical curriculum.");

        Task.findOne = originalTaskFindOne;
        UserTaskProgress.findOne = originalProgressFindOne;
    }

    // -------------------------------------------------------------
    // TEST 2: Task Read Projection - getallTasks
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: getallTasks Read-Projection & Master Visibility ---");
    {
        const originalTaskFind = Task.find;
        const originalProgressFind = UserTaskProgress.find;

        Task.find = () => createQueryChain([{ ...mockMasterTask }]);

        UserTaskProgress.find = ({ userId }) => ({
            lean: () => {
                if (userId.toString() === userA_Id.toString()) {
                    return Promise.resolve([{ ...mockUserAProgress }]);
                }
                return Promise.resolve([]);
            }
        });

        // User A list query
        const reqUserA = {
            query: {},
            body: { filter: {} },
            user: { _id: userA_Id, email: "userA@sarthi.com" },
            branchId: branchId.toString()
        };
        const resUserA = createMockRes();
        tc.getallTasks(reqUserA, resUserA);
        await resUserA.promise;

        if (resUserA.data.data[0].status !== "done") {
            throw new Error("Test 2A Failed: User A should see status 'done'");
        }
        console.log("✅ Test 2A Passed: User A sees personal status 'done' in task list.");

        // User B list query
        const reqUserB = {
            query: {},
            body: { filter: {} },
            user: { _id: userB_Id, email: "userB@sarthi.com" },
            branchId: branchId.toString()
        };
        const resUserB = createMockRes();
        tc.getallTasks(reqUserB, resUserB);
        await resUserB.promise;

        if (resUserB.data.data[0].status !== "todo" || resUserB.data.data[0].progress !== 0) {
            throw new Error("Test 2B Failed: User B should see clean 'todo' (0%) in task list");
        }
        console.log("✅ Test 2B Passed: User B sees clean 'todo' in task list for Admin-created curriculum.");

        Task.find = originalTaskFind;
        UserTaskProgress.find = originalProgressFind;
    }

    // -------------------------------------------------------------
    // TEST 3: Intent-Separated Writes - updatetaskLog
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: updatetaskLog Execution Isolation ---");
    {
        const originalTaskFindById = Task.findById;
        const originalTaskFind = Task.find;
        const originalProgressFindOne = UserTaskProgress.findOne;

        Task.findById = () => createQueryChain({ ...mockMasterTask });
        Task.find = () => createQueryChain([]); // No child tasks

        let savedUserProgress = null;
        UserTaskProgress.findOne = () => Promise.resolve(null);

        const originalSave = UserTaskProgress.prototype.save;
        UserTaskProgress.prototype.save = function() {
            savedUserProgress = this;
            return Promise.resolve(this);
        };

        const reqUserB = {
            params: { taskId: taskId1.toString() },
            body: { status: "inprogress", taskStartDate: "2026-08-15" },
            user: { _id: userB_Id, email: "userB@sarthi.com" },
            branchId: branchId.toString()
        };
        const resUserB = createMockRes();
        tc.updatetaskLog(reqUserB, resUserB);
        await resUserB.promise;

        if (!savedUserProgress || savedUserProgress.userId.toString() !== userB_Id.toString()) {
            throw new Error("Test 3 Failed: UserTaskProgress not saved with authenticated userB identity");
        }
        if (savedUserProgress.status !== "inprogress") {
            throw new Error("Test 3 Failed: Expected status 'inprogress'");
        }
        console.log("✅ Test 3 Passed: updatetaskLog creates isolated UserTaskProgress record without touching master Task.");

        Task.findById = originalTaskFindById;
        Task.find = originalTaskFind;
        UserTaskProgress.findOne = originalProgressFindOne;
        UserTaskProgress.prototype.save = originalSave;
    }

    // -------------------------------------------------------------
    // TEST 4: updateTask Guard & Intent Separation
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: updateTask Intent Separation & Curriculum Guard ---");
    {
        const originalTaskFindById = Task.findById;
        const originalTaskFind = Task.find;
        const originalTaskFindByIdAndUpdate = Task.findByIdAndUpdate;
        const originalProgressFindOne = UserTaskProgress.findOne;

        let masterTaskMutated = false;

        Task.findById = () => createQueryChain({ ...mockMasterTask });
        Task.find = () => createQueryChain([]);

        Task.findByIdAndUpdate = () => {
            masterTaskMutated = true;
            return Promise.resolve({ ...mockMasterTask });
        };

        UserTaskProgress.findOne = () => Promise.resolve(null);

        // Scenario 4A: Non-admin attempts to edit taskName (Curriculum)
        const reqNonAdmin = {
            params: { taskId: taskId1.toString() },
            body: { taskName: "Hacked Problem Name" },
            user: { _id: userA_Id, email: "userA@sarthi.com", role: "member" },
            branchId: branchId.toString()
        };
        const resNonAdmin = createMockRes();
        tc.updateTask(reqNonAdmin, resNonAdmin);
        await resNonAdmin.promise;

        if (resNonAdmin.statusCode !== 403) {
            throw new Error(`Test 4A Failed: Expected 403 Forbidden for non-admin curriculum update, got ${resNonAdmin.statusCode}`);
        }
        if (masterTaskMutated) {
            throw new Error("Test 4A Failed: Master task was mutated by non-admin!");
        }
        console.log("✅ Test 4A Passed: Non-admin curriculum mutation blocked with 403 Forbidden.");

        // Scenario 4B: Admin updates curriculum (taskName)
        masterTaskMutated = false;
        const reqAdminCurriculum = {
            params: { taskId: taskId1.toString() },
            body: { taskName: "Two Sum (Updated Description)" },
            user: { _id: admin_Id, email: "balajiaadi2000@gmail.com", role: "admin" },
            branchId: branchId.toString()
        };
        const resAdminCurriculum = createMockRes();
        tc.updateTask(reqAdminCurriculum, resAdminCurriculum);
        await resAdminCurriculum.promise;

        if (resAdminCurriculum.statusCode !== 200 || !masterTaskMutated) {
            throw new Error("Test 4B Failed: Admin curriculum update failed or did not mutate master task");
        }
        console.log("✅ Test 4B Passed: Admin can update canonical curriculum metadata.");

        // Scenario 4C: Admin personal execution update (status = 'done')
        let adminProgressSaved = false;
        const originalSave = UserTaskProgress.prototype.save;
        UserTaskProgress.prototype.save = function() {
            if (this.userId.toString() === admin_Id.toString()) {
                adminProgressSaved = true;
            }
            return Promise.resolve(this);
        };

        const reqAdminExecution = {
            params: { taskId: taskId1.toString() },
            body: { status: "done" },
            user: { _id: admin_Id, email: "balajiaadi2000@gmail.com", role: "admin" },
            branchId: branchId.toString()
        };
        const resAdminExecution = createMockRes();
        tc.updateTask(reqAdminExecution, resAdminExecution);
        await resAdminExecution.promise;

        if (!adminProgressSaved) {
            throw new Error("Test 4C Failed: Admin personal execution did not save to UserTaskProgress");
        }
        console.log("✅ Test 4C Passed: Admin personal execution writes to Admin's UserTaskProgress, preserving master content.");

        Task.findById = originalTaskFindById;
        Task.find = originalTaskFind;
        Task.findByIdAndUpdate = originalTaskFindByIdAndUpdate;
        UserTaskProgress.findOne = originalProgressFindOne;
        UserTaskProgress.prototype.save = originalSave;
    }

    // -------------------------------------------------------------
    // TEST 5: Identity Derivation & Cross-User Tampering Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Identity Derivation & Cross-User Tampering Protection ---");
    {
        const originalTaskFindById = Task.findById;
        const originalTaskFind = Task.find;
        const originalProgressFindOne = UserTaskProgress.findOne;
        let interceptedUserId = null;

        Task.findById = () => createQueryChain({ ...mockMasterTask });
        Task.find = () => createQueryChain([]);
        UserTaskProgress.findOne = () => Promise.resolve(null);

        const originalSave = UserTaskProgress.prototype.save;
        UserTaskProgress.prototype.save = function() {
            interceptedUserId = this.userId.toString();
            return Promise.resolve(this);
        };

        // Malicious User B tries to pass User A's ID in body
        const reqMalicious = {
            params: { taskId: taskId1.toString() },
            body: { status: "todo", userId: userA_Id.toString() },
            user: { _id: userB_Id, email: "userB@sarthi.com" },
            branchId: branchId.toString()
        };
        const resMalicious = createMockRes();
        tc.updatetaskLog(reqMalicious, resMalicious);
        await resMalicious.promise;

        if (interceptedUserId !== userB_Id.toString()) {
            throw new Error(`Test 5 Failed: Controller trusted req.body.userId instead of req.user._id! Intercepted: ${interceptedUserId}`);
        }
        console.log("✅ Test 5 Passed: Controller strictly derives identity from req.user._id; client-injected userId is ignored.");

        Task.findById = originalTaskFindById;
        Task.find = originalTaskFind;
        UserTaskProgress.findOne = originalProgressFindOne;
        UserTaskProgress.prototype.save = originalSave;
    }

    console.log("\n==================================================");
    console.log("    ALL PHASE 2B ISOLATION TESTS PASSED (5/5)     ");
    console.log("==================================================");
}

runPhase2BTests().catch(err => {
    console.error("\n❌ Phase 2B Test Failure:", err);
    process.exit(1);
});
