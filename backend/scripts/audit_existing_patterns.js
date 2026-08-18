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

async function audit() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await PamphletSyncService.syncUserPamphlet(USER_ID);

        console.log('\n=== EMPIRICAL DB AUDIT ACROSS ALL PATTERNS ===');
        console.log(`Total Patterns: ${result.patterns.length}\n`);

        let grandTotalAssigned = 0;
        let grandTotalCompleted = 0;

        result.patterns.forEach((p, i) => {
            const assigned = p.userProgress.totalAssigned;
            const completed = p.userProgress.totalCompleted;
            grandTotalAssigned += assigned;
            grandTotalCompleted += completed;

            const arenasInfo = p.userProgress.matchedArenas.map(a => `${a.arenaName}: ${a.completed}/${a.total}`).join(' | ');

            console.log(`${(i + 1).toString().padStart(2, ' ')}. [${p.topic}] ${p.patternName}`);
            console.log(`    Key: ${p.patternKey} | Tier: ${p.importanceTier} | Weightage: ${p.faangWeightage}`);
            console.log(`    Assigned: ${assigned} | Completed: ${completed} | Arenas: ${arenasInfo || 'None'}`);
        });

        console.log(`\nGrand Total Problems currently in DB across all projects: ${grandTotalAssigned} (Completed: ${grandTotalCompleted})`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

audit();
