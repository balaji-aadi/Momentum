import "dotenv/config";
import connectDB from "./config/db.config.js";
import { User } from "./models/user.model.js";
import { UserTaskProgress } from "./models/userTaskProgress.model.js";
import { UserArenaSchedule } from "./models/userArenaSchedule.model.js";

async function inspectUsers() {
    await connectDB();
    const users = await User.find({}).lean();
    console.log(`--- REAL USERS IN DB (${users.length}) ---`);
    users.forEach(u => {
        console.log(`User _id: ${u._id}`);
        console.log(`  Email: "${u.email}"`);
        console.log(`  Name: "${u.firstName} ${u.lastName}"`);
        console.log(`  UserRole: ${u.userRole}`);
        console.log(`  BranchAccess:`, JSON.stringify(u.branchAccess || []));
    });

    const schedules = await UserArenaSchedule.find({}).lean();
    console.log(`\n--- REAL SCHEDULES IN DB (${schedules.length}) ---`);
    schedules.forEach(s => {
        console.log(`Schedule: userId: ${s.userId}, projectId: ${s.projectId}, startDate: ${s.startDate}`);
    });

    const progressCount = await UserTaskProgress.countDocuments({});
    console.log(`\n--- REAL USER TASK PROGRESS RECORDS: ${progressCount} ---`);

    process.exit(0);
}

inspectUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
