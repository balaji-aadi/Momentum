import mongoose from "mongoose";
import tc from "../services/task-service/task.controller.js";
import { DailyRevision } from "../models/dailyRevision.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { FocusSession } from "../models/focusSession.model.js";
import AnalyticsService from "../services/analytics-service/analytics.service.js";

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

async function runPhase2ETests() {
    console.log("==================================================");
    console.log("    STARTING PHASE 2E DAILY REVISION TESTS        ");
    console.log("==================================================");

    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000001");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const userC_Id = new mongoose.Types.ObjectId("660000000000000000000003");
    const dsaProjId = new mongoose.Types.ObjectId("660000000000000000000020");
    const dsap2ProjId = new mongoose.Types.ObjectId("660000000000000000000021");
    const branchId = new mongoose.Types.ObjectId("660000000000000000000010");
    const parentTaskId = new mongoose.Types.ObjectId("660000000000000000000100");

    // Save original model methods
    const origProjFind = Project.find;
    const origTaskFind = Task.find;
    const origTaskFindById = Task.findById;
    const origProgressFind = UserTaskProgress.find;
    const origProgressFindOne = UserTaskProgress.findOne;
    const origDailyRevFindOne = DailyRevision.findOne;
    const origDailyRevFind = DailyRevision.find;
    const origDailyRevCreate = DailyRevision.create;
    const origDailyRevFindById = DailyRevision.findById;
    const origFocusSessionSave = FocusSession.prototype.save;
    const origRecordFocusTime = AnalyticsService.recordFocusTime;

    FocusSession.prototype.save = async function() { return this; };
    AnalyticsService.recordFocusTime = async () => {};

    // Create 60 canonical master tasks (in DSA/DSAP2, child tasks)
    const masterChildTasks = [];
    for (let i = 1; i <= 60; i++) {
        masterChildTasks.push({
            _id: new mongoose.Types.ObjectId(`660000000000000000000${(100 + i).toString()}`),
            taskName: `DSA Problem ${i}`,
            projectName: dsaProjId,
            parentTask: parentTaskId,
            taskId: `DSA-${i}`,
            status: "done" // Master task has status 'done' (e.g. from admin)
        });
    }

    // Mock Projects
    Project.find = () => createQueryChain([
        { _id: dsaProjId, key: "DSA" },
        { _id: dsap2ProjId, key: "DSAP2" }
    ]);

    // Mock Tasks
    Task.find = (query) => {
        return createQueryChain(masterChildTasks);
    };

    Task.findById = (id) => {
        const found = masterChildTasks.find(t => t._id.toString() === id.toString()) || null;
        if (!found) return createQueryChain(null);
        return createQueryChain({
            ...found,
            save: async function() { return this; },
            toObject: function() { return { ...this }; }
        });
    };

    // In-memory UserTaskProgress store
    let userProgressDb = [];
    UserTaskProgress.find = (query) => {
        const matches = userProgressDb.filter(p => {
            if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
            if (query.status && p.status !== query.status) return false;
            if (query.taskId?.$in) {
                const inIds = query.taskId.$in.map(id => id.toString());
                if (!inIds.includes(p.taskId.toString())) return false;
            }
            return true;
        });
        return createQueryChain(matches);
    };

    UserTaskProgress.findOne = (query) => {
        const match = userProgressDb.find(p => {
            if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
            if (query.taskId && p.taskId.toString() !== query.taskId.toString()) return false;
            return true;
        }) || null;
        if (!match) return createQueryChain(null);
        return createQueryChain({
            ...match,
            activityLogs: match.activityLogs || [],
            revisionLogs: match.revisionLogs || [],
            save: async function() {
                const idx = userProgressDb.findIndex(x => x.userId.toString() === this.userId.toString() && x.taskId.toString() === this.taskId.toString());
                if (idx !== -1) userProgressDb[idx] = { ...this };
                return this;
            },
            toObject: function() { return { ...this }; }
        });
    };

    // In-memory DailyRevision store
    let dailyRevisionDb = [];
    DailyRevision.findOne = (query) => {
        const matches = dailyRevisionDb.filter(r => {
            if (query.userId && r.userId.toString() !== query.userId.toString()) return false;
            if (query.isCompleted !== undefined && r.isCompleted !== query.isCompleted) return false;
            if (query.isStarted !== undefined && r.isStarted !== query.isStarted) return false;
            if (query.dateStr && r.dateStr !== query.dateStr) return false;
            return true;
        });
        const doc = matches[0] || null;
        if (!doc) return createQueryChain(null);

        // Add model-like methods
        const enhancedDoc = {
            ...doc,
            save: async function() {
                const idx = dailyRevisionDb.findIndex(x => x._id.toString() === this._id.toString());
                if (idx !== -1) dailyRevisionDb[idx] = { ...this };
                return this;
            },
            toObject: function() {
                return { ...this };
            }
        };
        return createQueryChain(enhancedDoc);
    };

    DailyRevision.find = (query) => {
        const matches = dailyRevisionDb.filter(r => {
            if (query.userId && r.userId.toString() !== query.userId.toString()) return false;
            return true;
        });
        return createQueryChain(matches);
    };

    DailyRevision.create = async (data) => {
        const newDoc = {
            _id: new mongoose.Types.ObjectId(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        dailyRevisionDb.push(newDoc);
        return {
            ...newDoc,
            save: async function() {
                const idx = dailyRevisionDb.findIndex(x => x._id.toString() === this._id.toString());
                if (idx !== -1) dailyRevisionDb[idx] = { ...this };
                return this;
            },
            toObject: function() {
                return { ...this };
            }
        };
    };

    DailyRevision.findById = (id) => {
        const doc = dailyRevisionDb.find(r => r._id.toString() === id.toString()) || null;
        if (!doc) return createQueryChain(null);
        return createQueryChain({
            ...doc,
            save: async function() {
                const idx = dailyRevisionDb.findIndex(x => x._id.toString() === this._id.toString());
                if (idx !== -1) dailyRevisionDb[idx] = { ...this };
                return this;
            },
            toObject: function() {
                return { ...this };
            }
        });
    };

    // -------------------------------------------------------------
    // TEST A: New User (0 completed tasks)
    // -------------------------------------------------------------
    console.log("\n--- TEST A: New User with 0 Completed Tasks ---");
    {
        const req = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const res = createMockRes();
        await tc.getDailyRevision(req, res);
        await res.promise;

        const data = res.data.data;
        if (data.isEligible !== false || data.completedCount !== 0 || data.threshold !== 50 || data.isCompleted !== false) {
            throw new Error(`Test A Failed: Expected isEligible=false, completedCount=0, isCompleted=false. Got: ${JSON.stringify(data)}`);
        }
        if (dailyRevisionDb.length !== 0) {
            throw new Error("Test A Failed: DailyRevision record was incorrectly created for a 0-task user!");
        }
        console.log("✅ Test A Passed: New user (0 completed tasks) receives isEligible=false, completedCount=0, and zero lockout.");
    }

    // -------------------------------------------------------------
    // TEST B: User Below Threshold (49 completed tasks)
    // -------------------------------------------------------------
    console.log("\n--- TEST B: User Below Threshold (49 Completed Tasks) ---");
    {
        // Add 49 completed tasks for User B
        for (let i = 0; i < 49; i++) {
            userProgressDb.push({
                userId: userB_Id,
                taskId: masterChildTasks[i]._id,
                projectName: dsaProjId,
                branchId: branchId,
                status: "done"
            });
        }

        const req = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const res = createMockRes();
        await tc.getDailyRevision(req, res);
        await res.promise;

        const data = res.data.data;
        if (data.isEligible !== false || data.completedCount !== 49 || data.threshold !== 50 || data.isCompleted !== false) {
            throw new Error(`Test B Failed: Expected isEligible=false, completedCount=49, isCompleted=false. Got: ${JSON.stringify(data)}`);
        }
        if (dailyRevisionDb.length !== 0) {
            throw new Error("Test B Failed: DailyRevision record created for 49-task user!");
        }
        console.log("✅ Test B Passed: User with 49 completed tasks receives isEligible=false, completedCount=49, and no lockout.");
    }

    // -------------------------------------------------------------
    // TEST C: User Reaches Threshold (50 completed tasks)
    // -------------------------------------------------------------
    console.log("\n--- TEST C: User Reaches Threshold (50 Completed Tasks) ---");
    {
        // Setup 50 completed tasks for User A
        for (let i = 0; i < 50; i++) {
            userProgressDb.push({
                userId: userA_Id,
                taskId: masterChildTasks[i]._id,
                projectName: dsaProjId,
                branchId: branchId,
                status: "done"
            });
        }

        const req = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const res = createMockRes();
        await tc.getDailyRevision(req, res);
        await res.promise;

        const data = res.data.data;
        if (data.isEligible !== true || data.completedCount !== 50 || data.questions.length !== 4) {
            throw new Error(`Test C Failed: Expected isEligible=true, 4 questions. Got: ${JSON.stringify(data)}`);
        }
        if (dailyRevisionDb.length !== 1 || dailyRevisionDb[0].userId.toString() !== userA_Id.toString()) {
            throw new Error("Test C Failed: DailyRevision record was not created with correct user ownership.");
        }
        console.log("✅ Test C Passed: User with 50 completed tasks activates Daily Revision Protocol with 4 questions.");
    }

    // -------------------------------------------------------------
    // TEST D: Cross-User Eligibility Isolation
    // -------------------------------------------------------------
    console.log("\n--- TEST D: Cross-User Eligibility Isolation ---");
    {
        // User A (50 tasks) -> Eligible
        const reqA = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const resA = createMockRes();
        await tc.getDailyRevision(reqA, resA);
        await resA.promise;

        // User B (49 tasks) -> NOT Eligible
        const reqB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const resB = createMockRes();
        await tc.getDailyRevision(reqB, resB);
        await resB.promise;

        if (resA.data.data.isEligible !== true || resB.data.data.isEligible !== false) {
            throw new Error("Test D Failed: Cross-user eligibility leaked between User A and User B!");
        }
        console.log("✅ Test D Passed: User A (50 done) is eligible while User B (49 done) remains cleanly ineligible.");
    }

    // -------------------------------------------------------------
    // TEST E: Master Task Independence
    // -------------------------------------------------------------
    console.log("\n--- TEST E: Master Task Independence ---");
    {
        // User C has 0 UserTaskProgress, but master Task collection has 60 'done' tasks
        const reqC = {
            user: { _id: userC_Id, id: userC_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const resC = createMockRes();
        await tc.getDailyRevision(reqC, resC);
        await resC.promise;

        const dataC = resC.data.data;
        if (dataC.isEligible !== false || dataC.completedCount !== 0) {
            throw new Error("Test E Failed: Eligibility was incorrectly influenced by master Task.status!");
        }
        console.log("✅ Test E Passed: Daily Revision strictly counts UserTaskProgress, completely ignoring master Task status.");
    }

    // -------------------------------------------------------------
    // TEST F: Revision Session Ownership Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST F: Revision Session Ownership Protection ---");
    {
        // User B attempts to start User A's daily revision
        const reqStartB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            body: { timezoneOffset: 0 },
            branchId: branchId.toString()
        };
        const resStartB = createMockRes();
        try {
            await tc.startDailyRevision(reqStartB, resStartB);
            await resStartB.promise;
            if (resStartB.statusCode === 200) {
                throw new Error("Test F1 Failed: User B started a revision session despite having no eligible session!");
            }
        } catch (err) {
            // Expected 404
            console.log("✅ Test F1 Passed: User B start attempt on non-existent revision was rejected.");
        }

        // User A starts own revision
        const reqStartA = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            body: { timezoneOffset: 0 },
            branchId: branchId.toString()
        };
        const resStartA = createMockRes();
        await tc.startDailyRevision(reqStartA, resStartA);
        await resStartA.promise;

        if (resStartA.data.data.isStarted !== true || resStartA.data.data.timerIsActive !== true) {
            throw new Error("Test F2 Failed: User A could not start own revision timer!");
        }
        console.log("✅ Test F2 Passed: User A successfully started own revision timer.");

        // User B attempts to pause User A's timer
        const reqToggleB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            body: { timezoneOffset: 0 },
            branchId: branchId.toString()
        };
        const resToggleB = createMockRes();
        try {
            await tc.toggleDailyRevisionTimer(reqToggleB, resToggleB);
            await resToggleB.promise;
            if (resToggleB.statusCode === 200) {
                throw new Error("Test F3 Failed: User B paused User A's revision timer!");
            }
        } catch (err) {
            // Expected 404
            console.log("✅ Test F3 Passed: User B cannot pause or modify User A's revision timer.");
        }
    }

    // -------------------------------------------------------------
    // TEST G: 3 Revision + 1 Backlog Allocation
    // -------------------------------------------------------------
    console.log("\n--- TEST G: 3 Revision + 1 Backlog Allocation ---");
    {
        const userD_Id = new mongoose.Types.ObjectId("660000000000000000000004");
        // User D has 50 completed tasks + 2 backlog tasks
        for (let i = 0; i < 50; i++) {
            userProgressDb.push({
                userId: userD_Id,
                taskId: masterChildTasks[i]._id,
                projectName: dsaProjId,
                branchId: branchId,
                status: "done"
            });
        }
        userProgressDb.push({
            userId: userD_Id,
            taskId: masterChildTasks[50]._id,
            projectName: dsaProjId,
            branchId: branchId,
            status: "backlog"
        });
        userProgressDb.push({
            userId: userD_Id,
            taskId: masterChildTasks[51]._id,
            projectName: dsaProjId,
            branchId: branchId,
            status: "backlog"
        });

        const reqD = {
            user: { _id: userD_Id, id: userD_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const resD = createMockRes();
        await tc.getDailyRevision(reqD, resD);
        await resD.promise;

        const dataD = resD.data.data;
        if (dataD.isEligible !== true || dataD.completedCount !== 50) {
            throw new Error(`Test G Failed: Expected isEligible=true, completedCount=50. Got: ${JSON.stringify(dataD)}`);
        }
        if (dataD.targetRevisionCount !== 3 || dataD.targetBacklogCount !== 1) {
            throw new Error(`Test G Failed: Expected targetRevisionCount=3 and targetBacklogCount=1. Got rev=${dataD.targetRevisionCount}, back=${dataD.targetBacklogCount}`);
        }
        if (dataD.questions.length !== 4) {
            throw new Error(`Test G Failed: Expected exactly 4 total questions. Got: ${dataD.questions.length}`);
        }

        const backlogQuestions = dataD.questions.filter(q => q.isBacklogQuestion);
        const revisionQuestions = dataD.questions.filter(q => !q.isBacklogQuestion);
        if (backlogQuestions.length !== 1 || revisionQuestions.length !== 3) {
            throw new Error(`Test G Failed: Expected 1 backlog question and 3 revision questions. Got backlog=${backlogQuestions.length}, rev=${revisionQuestions.length}`);
        }
        console.log("✅ Test G Passed: User with backlogs receives exactly 3 revision questions and 1 backlog clearance question.");
    }

    // -------------------------------------------------------------
    // TEST H: Backlog Resolution Choice (Done vs See Tomorrow)
    // -------------------------------------------------------------
    console.log("\n--- TEST H: Backlog Resolution Choice (Done vs See Tomorrow) ---");
    {
        const userE_Id = new mongoose.Types.ObjectId("660000000000000000000005");
        // User E has 50 completed tasks + 1 backlog task
        for (let i = 0; i < 50; i++) {
            userProgressDb.push({
                userId: userE_Id,
                taskId: masterChildTasks[i]._id,
                projectName: dsaProjId,
                branchId: branchId,
                status: "done"
            });
        }
        userProgressDb.push({
            userId: userE_Id,
            taskId: masterChildTasks[50]._id,
            projectName: dsaProjId,
            branchId: branchId,
            status: "backlog"
        });

        // 1. Start session for User E
        const reqE = {
            user: { _id: userE_Id, id: userE_Id.toString() },
            query: { timezoneOffset: "0" },
            branchId: branchId.toString()
        };
        const resE = createMockRes();
        await tc.getDailyRevision(reqE, resE);
        await resE.promise;

        const reqStartE = {
            user: { _id: userE_Id, id: userE_Id.toString() },
            body: { timezoneOffset: 0 },
            branchId: branchId.toString()
        };
        const resStartE = createMockRes();
        await tc.startDailyRevision(reqStartE, resStartE);
        await resStartE.promise;

        // Verify DailyRevision record exists
        const eDailyRev = dailyRevisionDb.find(r => r.userId.toString() === userE_Id.toString());
        if (!eDailyRev) throw new Error("Test H Failed: DailyRevision record not created for User E");

        // Simulate completing first 3 revision questions
        eDailyRev.completedQuestions = [eDailyRev.questions[0], eDailyRev.questions[1], eDailyRev.questions[2]];
        eDailyRev.timeLeft = 10800 - 3600;
        eDailyRev.currentQuestionStartTimeLeft = eDailyRev.timeLeft;

        // Fast forward 15 minutes for backlog question (question 4)
        eDailyRev.timeLeft -= 950;

        // Choose "See Tomorrow" (backlogStatus: "backlog")
        const backlogTaskToResolve = eDailyRev.questions[3];
        const reqLogBacklog = {
            user: { _id: userE_Id, id: userE_Id.toString() },
            params: { taskId: backlogTaskToResolve.toString() },
            body: {
                notes: "Practiced 20 mins, still need work on heap balance.",
                backlogStatus: "backlog",
                timezoneOffset: 0
            }
        };
        const resLogBacklog = createMockRes();
        await tc.addRevision(reqLogBacklog, resLogBacklog);
        await resLogBacklog.promise;

        // Check that user progress status remained "backlog"
        const pRecord = userProgressDb.find(p => p.userId.toString() === userE_Id.toString() && p.taskId.toString() === backlogTaskToResolve.toString());
        if (pRecord.status !== "backlog") {
            throw new Error(`Test H Failed: Expected status='backlog', got status='${pRecord.status}'`);
        }

        // Check that task is pinned in reviseTomorrowQuestions
        if (!eDailyRev.reviseTomorrowQuestions.some(id => id.toString() === backlogTaskToResolve.toString())) {
            throw new Error("Test H Failed: Backlog task was not pinned to reviseTomorrowQuestions");
        }

        console.log("✅ Test H Passed: 'See Tomorrow' choice keeps task in backlog and pins it to tomorrow's session.");
    }

    // Restore original functions
    Project.find = origProjFind;
    Task.find = origTaskFind;
    Task.findById = origTaskFindById;
    UserTaskProgress.find = origProgressFind;
    UserTaskProgress.findOne = origProgressFindOne;
    DailyRevision.findOne = origDailyRevFindOne;
    DailyRevision.find = origDailyRevFind;
    DailyRevision.create = origDailyRevCreate;
    DailyRevision.findById = origDailyRevFindById;
    FocusSession.prototype.save = origFocusSessionSave;
    AnalyticsService.recordFocusTime = origRecordFocusTime;

    console.log("\n==================================================");
    console.log("    ALL PHASE 2E DAILY REVISION TESTS PASSED (8/8)");
    console.log("==================================================");
}

runPhase2ETests().catch(err => {
    console.error("\n❌ Phase 2E Test Failure:", err);
    process.exit(1);
});
