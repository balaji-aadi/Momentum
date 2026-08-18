import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PamphletSyncService } from '../services/pamphlet-service/pamphletSync.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const USER_ID = '6993047f16e85ff3e4efd9a3'; // Balaji Aadi

async function checkGaps() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Project = mongoose.connection.collection('projects');
        const projects = await Project.find({}).toArray();
        console.log('\n--- Existing Arenas in DB ---');
        projects.forEach(p => console.log(`• Key: ${p.key || 'N/A'}, Name: "${p.name}", ID: ${p._id}, BranchId: ${p.branchId}`));

        const result = await PamphletSyncService.syncUserPamphlet(USER_ID);

        console.log('\n--- DSA Pamphlet Patterns Gap Analysis ---');
        const missingPatterns = result.patterns.filter(p => p.userProgress.totalAssigned === 0);
        const presentPatterns = result.patterns.filter(p => p.userProgress.totalAssigned > 0);

        console.log(`Total Patterns in Pamphlet Roadmap: ${result.patterns.length}`);
        console.log(`Patterns already present in DSA / DSAphase2: ${presentPatterns.length}`);
        console.log(`Patterns MISSING (0 problems in DB): ${missingPatterns.length}`);

        console.log('\n--- Missing Patterns to include in DSA Phase 3 ---');
        missingPatterns.forEach((p, idx) => {
            console.log(`${idx + 1}. [${p.topic}] ${p.patternName} (${p.faangWeightage})`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkGaps();
