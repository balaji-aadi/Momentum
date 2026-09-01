import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function resetDsaPhase3Schedule() {
    try {
        console.log('[Reset] Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('[Reset] Connected successfully.');

        const Project = mongoose.connection.collection('projects');
        const Task = mongoose.connection.collection('tasks');
        const UserArenaSchedule = mongoose.connection.collection('userarenaschedules');
        const UserTaskProgress = mongoose.connection.collection('usertaskprogresses');

        // 1. Locate ONLY DSA Phase 3 project
        const dsap3Proj = await Project.findOne({ key: 'DSAP3' });
        if (!dsap3Proj) {
            console.error('[Reset] ERROR: DSA Phase 3 project (DSAP3) not found!');
            process.exit(1);
        }

        console.log(`[Reset] Found DSA Phase 3 Project (ID: ${dsap3Proj._id})`);

        // 2. Count existing tasks for DSAP3
        const initialTaskCount = await Task.countDocuments({ projectName: dsap3Proj._id });
        console.log(`[Reset] Found ${initialTaskCount} tasks in DSA Phase 3.`);

        // 3. Clear dates from all DSAP3 tasks
        const updateResult = await Task.updateMany(
            { projectName: dsap3Proj._id },
            {
                $set: {
                    taskStartDate: null,
                    taskDueDate: null,
                    updatedAt: new Date()
                }
            }
        );
        console.log(`[Reset] Cleared dates on ${updateResult.modifiedCount} tasks for DSAP3.`);

        // 4. Update DSAP3 Project record to ensure dates are null and status is active
        await Project.updateOne(
            { _id: dsap3Proj._id },
            {
                $set: {
                    startDate: null,
                    endDate: null,
                    status: 'active',
                    updatedAt: new Date()
                }
            }
        );
        console.log('[Reset] Updated DSA Phase 3 project record (startDate: null, endDate: null, status: active).');

        // 5. Remove any UserArenaSchedule or UserTaskProgress for DSAP3
        const schedDel = await UserArenaSchedule.deleteMany({ projectId: dsap3Proj._id });
        const progDel = await UserTaskProgress.deleteMany({ projectId: dsap3Proj._id });
        console.log(`[Reset] Removed ${schedDel.deletedCount} UserArenaSchedule and ${progDel.deletedCount} UserTaskProgress records for DSAP3.`);

        // 6. Verify total task count is preserved
        const finalTaskCount = await Task.countDocuments({ projectName: dsap3Proj._id });
        console.log(`[Reset] Verification: ${finalTaskCount} tasks exist in DSAP3 (initial: ${initialTaskCount}). Zero tasks deleted.`);

        // 7. Verify all tasks have null dates
        const tasksWithDates = await Task.countDocuments({
            projectName: dsap3Proj._id,
            $or: [
                { taskStartDate: { $ne: null, $exists: true } },
                { taskDueDate: { $ne: null, $exists: true } }
            ]
        });
        console.log(`[Reset] Tasks with dates remaining in DSAP3: ${tasksWithDates}`);

        console.log('\n[Reset] SUCCESS! DSA Phase 3 is now in the clean "Schedule Arena" stage.');
        process.exit(0);
    } catch (error) {
        console.error('[Reset] Error during reset:', error);
        process.exit(1);
    }
}

resetDsaPhase3Schedule();
