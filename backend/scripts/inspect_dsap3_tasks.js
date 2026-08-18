import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Task = mongoose.connection.collection('tasks');
        const Project = mongoose.connection.collection('projects');

        const dsap3Proj = await Project.findOne({ key: 'DSAP3' });
        console.log('DSA Phase 3 Project:', dsap3Proj);

        if (!dsap3Proj) {
            console.log('DSA Phase 3 project not found!');
            process.exit(1);
        }

        const tasks = await Task.find({ projectName: dsap3Proj._id }).toArray();
        console.log(`Total Tasks found in DB for DSAP3: ${tasks.length}`);

        if (tasks.length > 0) {
            console.log('Sample Parent Task:', tasks.find(t => t.parentTask === null));
            console.log('Sample Child Task:', tasks.find(t => t.parentTask !== null));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
