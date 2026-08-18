import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function inspectOtherArenas() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Task = mongoose.connection.collection('tasks');
        const Project = mongoose.connection.collection('projects');

        const dsa1 = await Project.findOne({ key: 'DSA' });
        const dsa2 = await Project.findOne({ key: 'DSAP2' });

        console.log('--- DSA Phase 2 Sample Tasks ---');
        const dsa2Tasks = await Task.find({ projectName: dsa2._id }).limit(5).toArray();
        dsa2Tasks.forEach(t => console.log(`Task: ${t.taskName} | Status: "${t.status}" | Parent: ${t.parentTask}`));

        console.log('\n--- DSA Phase 1 Sample Tasks ---');
        const dsa1Tasks = await Task.find({ projectName: dsa1._id }).limit(5).toArray();
        dsa1Tasks.forEach(t => console.log(`Task: ${t.taskName} | Status: "${t.status}" | Parent: ${t.parentTask}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectOtherArenas();
