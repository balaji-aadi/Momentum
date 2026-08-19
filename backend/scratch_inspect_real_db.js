import "dotenv/config";
import connectDB from "./config/db.config.js";
import { Branch } from "./models/branch.model.js";
import { Project } from "./models/project.model.js";
import { Task } from "./models/task.model.js";
import { User } from "./models/user.model.js";
import { UserTaskProgress } from "./models/userTaskProgress.model.js";
import { UserArenaSchedule } from "./models/userArenaSchedule.model.js";

async function inspectRealDb() {
    await connectDB();
    console.log("=== CONNECTED TO REAL MONGODB DATABASE ===");

    // 1. Inspect Branches
    const branches = await Branch.find({}).lean();
    console.log("\n--- REAL BRANCHES IN DB ---");
    branches.forEach(b => {
        console.log(`Branch ID: ${b._id}, Name: "${b.name}", Code: "${b.code}"`);
    });

    // 2. Inspect Projects / Arenas
    const projects = await Project.find({}).lean();
    console.log(`\n--- REAL PROJECTS IN DB (Total: ${projects.length}) ---`);
    for (const p of projects) {
        const totalTasks = await Task.countDocuments({ projectName: p._id });
        const parentTasks = await Task.countDocuments({ 
            projectName: p._id, 
            $or: [{ parentTask: null }, { parentTask: { $exists: false } }] 
        });
        const childTasks = await Task.countDocuments({ 
            projectName: p._id, 
            parentTask: { $ne: null, $exists: true } 
        });
        const tasksWithBranchId = await Task.countDocuments({ 
            projectName: p._id, 
            branchId: { $ne: null, $exists: true } 
        });
        const tasksWithoutBranchId = await Task.countDocuments({ 
            projectName: p._id, 
            $or: [{ branchId: null }, { branchId: { $exists: false } }] 
        });

        console.log(`\nProject _id: ${p._id}`);
        console.log(`  Name: "${p.name}"`);
        console.log(`  Key: "${p.key}"`);
        console.log(`  BranchId on Project: ${p.branchId}`);
        console.log(`  Total Tasks: ${totalTasks}`);
        console.log(`  Parent Tasks: ${parentTasks}, Child Tasks: ${childTasks}`);
        console.log(`  Tasks with branchId in Task doc: ${tasksWithBranchId}`);
        console.log(`  Tasks WITHOUT branchId in Task doc: ${tasksWithoutBranchId}`);

        // Sample 3 tasks
        const sampleTasks = await Task.find({ projectName: p._id }).limit(3).lean();
        console.log(`  Sample Tasks:`);
        sampleTasks.forEach((st, i) => {
            console.log(`    [${i+1}] _id: ${st._id}, taskId: "${st.taskId}", name: "${st.taskName}", parentTask: ${st.parentTask}, branchId: ${st.branchId}`);
        });
    }

    // 3. Inspect Users
    const users = await User.find({}).select("email firstName lastName userRole branchAccess").populate("userRole").lean();
    console.log(`\n--- REAL USERS IN DB (Total: ${users.length}) ---`);
    users.forEach(u => {
        console.log(`User _id: ${u._id}, Email: "${u.email}", Name: "${u.firstName} ${u.lastName}", Role: ${u.userRole?.name || 'N/A'}`);
        console.log(`  BranchAccess:`, JSON.stringify(u.branchAccess || []));
    });

    // 4. Inspect UserArenaSchedule
    const schedules = await UserArenaSchedule.find({}).lean();
    console.log(`\n--- REAL USER ARENA SCHEDULES IN DB (Total: ${schedules.length}) ---`);
    schedules.forEach(s => {
        console.log(`Schedule _id: ${s._id}, userId: ${s.userId}, projectId: ${s.projectId}, startDate: ${s.startDate}, tasksPerDay: ${s.tasksPerDay}`);
    });

    // 5. Inspect UserTaskProgress
    const progressCount = await UserTaskProgress.countDocuments({});
    console.log(`\n--- REAL USER TASK PROGRESS COUNT IN DB: ${progressCount} ---`);

    process.exit(0);
}

inspectRealDb().catch(err => {
    console.error("Inspect DB Error:", err);
    process.exit(1);
});
