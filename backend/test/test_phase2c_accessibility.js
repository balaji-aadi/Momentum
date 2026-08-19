import mongoose from "mongoose";
import pc from "../services/project-service/project.controller.js";
import { BranchController } from "../services/branch-service/branch.controller.js";
import { Project } from "../models/project.model.js";
import { Branch } from "../models/branch.model.js";
import { Task } from "../models/task.model.js";
import { Milestone } from "../models/milestone.model.js";
import { Sprint } from "../models/sprint.model.js";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import { User } from "../models/user.model.js";

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

async function runPhase2CTests() {
    console.log("==================================================");
    console.log("    STARTING PHASE 2C ACCESSIBILITY TESTS         ");
    console.log("==================================================");

    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000001");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const admin_Id = new mongoose.Types.ObjectId("660000000000000000000003");
    const branchId = new mongoose.Types.ObjectId("660000000000000000000010");
    const projectId1 = new mongoose.Types.ObjectId("660000000000000000000020");

    // Canonical Master Branch Mock
    const mockMasterBranch = {
        _id: branchId,
        name: "Software Development",
        slug: "software-development",
        description: "Core Software Engineering Branch",
        visibility: "public",
        createdBy: admin_Id,
        toObject() { return { ...this }; }
    };

    // Canonical Master Project Mock
    const mockMasterProject = {
        _id: projectId1,
        name: "DSA Arena",
        key: "DSA",
        description: "Data Structures & Algorithms Canonical Arena",
        branchId: branchId,
        teamMembers: [],
        rolesAndResponsibilities: [],
        createdBy: admin_Id,
        toObject() { return { ...this }; }
    };

    // -------------------------------------------------------------
    // TEST A: Member Curriculum Visibility (Branch & Project Read)
    // -------------------------------------------------------------
    console.log("\n--- TEST A: Member Curriculum Read Visibility ---");
    {
        const origBranchFind = Branch.find;
        const origUserFindOne = User.findOne;
        const origProjectFind = Project.find;
        const origMilestoneFind = Milestone.find;
        const origTaskAggregate = Task.aggregate;
        const origUserProgressAggregate = UserTaskProgress.aggregate;

        User.findOne = () => createQueryChain({ _id: admin_Id, email: "balajiaadi2000@gmail.com" });
        Branch.find = (query) => {
            // Verify query includes public or admin-created branches
            return createQueryChain([mockMasterBranch]);
        };

        const reqMember = {
            user: { _id: userB_Id, email: "testone@sarthi.com", role: "member", branchAccess: [] }
        };
        const resBranch = createMockRes();
        BranchController.getBranches(reqMember, resBranch);
        await resBranch.promise;

        if (!resBranch.data.data.some(b => b.name === "Software Development")) {
            throw new Error("Test A1 Failed: Member could not see Admin-created 'Software Development' branch");
        }
        console.log("✅ Test A1 Passed: Member sees Admin-created 'Software Development' branch.");

        // Member queries Projects in active branch
        Project.find = () => createQueryChain([mockMasterProject]);
        Milestone.find = () => Promise.resolve([]);
        Task.aggregate = () => Promise.resolve([{ _id: projectId1, totalTasks: 10 }]);
        UserTaskProgress.aggregate = () => Promise.resolve([{ _id: projectId1, completedTasks: 0 }]);

        const reqProjectMember = {
            query: {},
            body: { filter: {} },
            branchId: branchId.toString(),
            user: { _id: userB_Id, email: "testone@sarthi.com", role: "member" }
        };
        const resProjects = createMockRes();
        pc.getAllProject(reqProjectMember, resProjects);
        await resProjects.promise;

        if (resProjects.data.data.length === 0 || resProjects.data.data[0].name !== "DSA Arena") {
            throw new Error("Test A2 Failed: Member could not see Admin-created 'DSA Arena' project");
        }
        console.log("✅ Test A2 Passed: Member sees Admin-created 'DSA Arena' project in active branch.");

        Branch.find = origBranchFind;
        User.findOne = origUserFindOne;
        Project.find = origProjectFind;
        Milestone.find = origMilestoneFind;
        Task.aggregate = origTaskAggregate;
        UserTaskProgress.aggregate = origUserProgressAggregate;
    }

    // -------------------------------------------------------------
    // TEST B: Member Project Mutation Protection (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n--- TEST B: Member Project Mutation Protection ---");
    {
        const origProjectCreate = Project.create;
        const origProjectFindById = Project.findById;
        const origProjectFindByIdAndUpdate = Project.findByIdAndUpdate;
        const origProjectFindByIdAndDelete = Project.findByIdAndDelete;

        let mutated = false;
        Project.create = () => { mutated = true; return Promise.resolve(mockMasterProject); };
        Project.findByIdAndUpdate = () => { mutated = true; return Promise.resolve(mockMasterProject); };
        Project.findByIdAndDelete = () => { mutated = true; return Promise.resolve(mockMasterProject); };
        Project.findById = () => createQueryChain(mockMasterProject);

        const reqMember = {
            params: { projectId: projectId1.toString() },
            body: { name: "Hacked Arena" },
            branchId: branchId.toString(),
            user: { _id: userB_Id, email: "testone@sarthi.com", role: "member" }
        };

        // Create attempt
        const resCreate = createMockRes();
        pc.createProject(reqMember, resCreate);
        await resCreate.promise;
        if (resCreate.statusCode !== 403) throw new Error(`Test B1 Failed: Expected 403 for member createProject, got ${resCreate.statusCode}`);

        // Update attempt
        const resUpdate = createMockRes();
        pc.updateProject(reqMember, resUpdate);
        await resUpdate.promise;
        if (resUpdate.statusCode !== 403) throw new Error(`Test B2 Failed: Expected 403 for member updateProject, got ${resUpdate.statusCode}`);

        // Delete attempt
        const resDelete = createMockRes();
        pc.deleteProject(reqMember, resDelete);
        await resDelete.promise;
        if (resDelete.statusCode !== 403) throw new Error(`Test B3 Failed: Expected 403 for member deleteProject, got ${resDelete.statusCode}`);

        if (mutated) throw new Error("Test B Failed: Master project was mutated by member!");
        console.log("✅ Test B Passed: Member project mutations (create/update/delete) are blocked with 403 Forbidden.");

        Project.create = origProjectCreate;
        Project.findById = origProjectFindById;
        Project.findByIdAndUpdate = origProjectFindByIdAndUpdate;
        Project.findByIdAndDelete = origProjectFindByIdAndDelete;
    }

    // -------------------------------------------------------------
    // TEST C: Member Branch Mutation Protection (403 Forbidden)
    // -------------------------------------------------------------
    console.log("\n--- TEST C: Member Branch Mutation Protection ---");
    {
        const origBranchCreate = Branch.create;
        const origBranchFindById = Branch.findById;
        const origBranchFindByIdAndDelete = Branch.findByIdAndDelete;

        let branchMutated = false;
        Branch.create = () => { branchMutated = true; return Promise.resolve(mockMasterBranch); };
        Branch.findByIdAndDelete = () => { branchMutated = true; return Promise.resolve(mockMasterBranch); };
        Branch.findById = () => createQueryChain(mockMasterBranch);

        const reqMember = {
            params: { branchId: branchId.toString() },
            body: { name: "Hacked Branch", confirmationName: "Software Development" },
            user: { _id: userB_Id, email: "testone@sarthi.com", role: "member" }
        };

        // Create attempt
        const resCreate = createMockRes();
        BranchController.createBranch(reqMember, resCreate);
        await resCreate.promise;
        if (resCreate.statusCode !== 403) throw new Error(`Test C1 Failed: Expected 403 for member createBranch, got ${resCreate.statusCode}`);

        // Update attempt
        const resUpdate = createMockRes();
        BranchController.updateBranch(reqMember, resUpdate);
        await resUpdate.promise;
        if (resUpdate.statusCode !== 403) throw new Error(`Test C2 Failed: Expected 403 for member updateBranch, got ${resUpdate.statusCode}`);

        // Delete attempt
        const resDelete = createMockRes();
        BranchController.deleteBranch(reqMember, resDelete);
        await resDelete.promise;
        if (resDelete.statusCode !== 403) throw new Error(`Test C3 Failed: Expected 403 for member deleteBranch, got ${resDelete.statusCode}`);

        if (branchMutated) throw new Error("Test C Failed: Master branch was mutated by member!");
        console.log("✅ Test C Passed: Member branch mutations (create/update/delete) are blocked with 403 Forbidden.");

        Branch.create = origBranchCreate;
        Branch.findById = origBranchFindById;
        Branch.findByIdAndDelete = origBranchFindByIdAndDelete;
    }

    // -------------------------------------------------------------
    // TEST D: Admin Management Operations
    // -------------------------------------------------------------
    console.log("\n--- TEST D: Admin Management Operations ---");
    {
        const origProjectCreate = Project.create;
        const origProjectFindById = Project.findById;
        const origProjectFindByIdAndUpdate = Project.findByIdAndUpdate;
        const origProjectFindByIdAndDelete = Project.findByIdAndDelete;
        const origTaskDeleteMany = Task.deleteMany;
        const origMilestoneDeleteMany = Milestone.deleteMany;
        const origSprintDeleteMany = Sprint.deleteMany;

        let adminCreated = false;
        let adminUpdated = false;
        let adminDeleted = false;

        Project.create = () => { adminCreated = true; return Promise.resolve(mockMasterProject); };
        Project.findById = () => createQueryChain(mockMasterProject);
        Project.findByIdAndUpdate = () => { adminUpdated = true; return Promise.resolve(mockMasterProject); };
        Project.findByIdAndDelete = () => { adminDeleted = true; return Promise.resolve(mockMasterProject); };
        Task.deleteMany = () => Promise.resolve({ deletedCount: 0 });
        Milestone.deleteMany = () => Promise.resolve({ deletedCount: 0 });
        Sprint.deleteMany = () => Promise.resolve({ deletedCount: 0 });

        const reqAdmin = {
            params: { projectId: projectId1.toString() },
            body: {
                name: "System Design Arena",
                access: "public",
                key: "SYS",
                startDate: "2026-08-01",
                endDate: "2026-10-01",
                priority: "high",
                projectManager: admin_Id,
                rolesAndResponsibilities: [],
                status: "active"
            },
            branchId: branchId.toString(),
            user: { _id: admin_Id, email: "balajiaadi2000@gmail.com", role: "admin" }
        };

        // Create Project as Admin
        const resCreate = createMockRes();
        pc.createProject(reqAdmin, resCreate);
        await resCreate.promise;
        if (resCreate.statusCode !== 201 || !adminCreated) throw new Error("Test D1 Failed: Admin createProject failed");

        // Update Project as Admin
        const resUpdate = createMockRes();
        pc.updateProject(reqAdmin, resUpdate);
        await resUpdate.promise;
        if (resUpdate.statusCode !== 200 || !adminUpdated) throw new Error("Test D2 Failed: Admin updateProject failed");

        // Delete Project as Admin
        const resDelete = createMockRes();
        pc.deleteProject(reqAdmin, resDelete);
        await resDelete.promise;
        if (resDelete.statusCode !== 200 || !adminDeleted) throw new Error("Test D3 Failed: Admin deleteProject failed");

        console.log("✅ Test D Passed: Admin successfully manages Projects/Arenas (create/update/delete).");

        Project.create = origProjectCreate;
        Project.findById = origProjectFindById;
        Project.findByIdAndUpdate = origProjectFindByIdAndUpdate;
        Project.findByIdAndDelete = origProjectFindByIdAndDelete;
        Task.deleteMany = origTaskDeleteMany;
        Milestone.deleteMany = origMilestoneDeleteMany;
        Sprint.deleteMany = origSprintDeleteMany;
    }

    // -------------------------------------------------------------
    // TEST E: Multi-User Visibility with Isolated Task Stats
    // -------------------------------------------------------------
    console.log("\n--- TEST E: Multi-User Arena Visibility with Isolated Task Stats ---");
    {
        const origProjectFind = Project.find;
        const origMilestoneFind = Milestone.find;
        const origTaskAggregate = Task.aggregate;
        const origUserProgressAggregate = UserTaskProgress.aggregate;

        Project.find = () => createQueryChain([mockMasterProject]);
        Milestone.find = () => Promise.resolve([]);
        Task.aggregate = () => Promise.resolve([{ _id: projectId1, totalTasks: 5 }]);

        // User A has 2 completed tasks
        UserTaskProgress.aggregate = (pipeline) => {
            const matchStage = Array.isArray(pipeline) ? pipeline.find(s => s.$match)?.$match : null;
            if (matchStage && matchStage.userId && matchStage.userId.toString() === userA_Id.toString()) {
                return Promise.resolve([{ _id: projectId1, completedTasks: 2 }]);
            }
            // User B has 0 completed tasks
            return Promise.resolve([]);
        };

        // User A query
        const reqUserA = {
            query: {},
            body: { filter: {} },
            branchId: branchId.toString(),
            user: { _id: userA_Id, email: "userA@sarthi.com", role: "member" }
        };
        const resUserA = createMockRes();
        pc.getAllProject(reqUserA, resUserA);
        await resUserA.promise;

        const statsA = resUserA.data.data[0].taskStats;
        if (statsA.total !== 5 || statsA.completed !== 2 || statsA.percentage !== 40) {
            throw new Error(`Test E1 Failed: User A expected 2/5 (40%), got ${JSON.stringify(statsA)}`);
        }
        console.log("✅ Test E1 Passed: User A sees Arena with personal progress 2/5 (40%).");

        // User B query
        const reqUserB = {
            query: {},
            body: { filter: {} },
            branchId: branchId.toString(),
            user: { _id: userB_Id, email: "userB@sarthi.com", role: "member" }
        };
        const resUserB = createMockRes();
        pc.getAllProject(reqUserB, resUserB);
        await resUserB.promise;

        const statsB = resUserB.data.data[0].taskStats;
        if (statsB.total !== 5 || statsB.completed !== 0 || statsB.percentage !== 0) {
            throw new Error(`Test E2 Failed: User B expected 0/5 (0%), got ${JSON.stringify(statsB)}`);
        }
        console.log("✅ Test E2 Passed: User B sees clean Arena with personal progress 0/5 (0%).");

        Project.find = origProjectFind;
        Milestone.find = origMilestoneFind;
        Task.aggregate = origTaskAggregate;
        UserTaskProgress.aggregate = origUserProgressAggregate;
    }

    console.log("\n==================================================");
    console.log("    ALL PHASE 2C ACCESSIBILITY TESTS PASSED (5/5) ");
    console.log("==================================================");
}

runPhase2CTests().catch(err => {
    console.error("\n❌ Phase 2C Test Failure:", err);
    process.exit(1);
});
