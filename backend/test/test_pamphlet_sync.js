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

async function runTest() {
    try {
        console.log('[Test] Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('[Test] Connected to MongoDB.');

        console.log('[Test] Executing Pamphlet Sync for User:', USER_ID);
        const result = await PamphletSyncService.syncUserPamphlet(USER_ID);

        console.log('\n=== PAMPHLET SYNC RESULTS ===');
        console.log(`FAANG Readiness Score: ${result.overallReadinessPercent}%`);
        console.log(`Patterns Mastered: ${result.completedPatternsCount} / ${result.totalPatternsCount}`);
        console.log(`Total Topics: ${result.topics.length}`);

        console.log('\n--- Topic Progress Breakdown ---');
        result.topics.forEach(t => {
            console.log(`• ${t.topicName}: ${t.completedPatterns}/${t.totalPatterns} patterns completed (${t.progressPercent}%) [${t.totalCompletedProblems}/${t.totalAssignedProblems} problems]`);
        });

        console.log('\n--- Sample Patterns & Matched Arenas ---');
        result.patterns.slice(0, 5).forEach(p => {
            const up = p.userProgress;
            console.log(`Pattern: [${p.patternName}] (${p.topic})`);
            console.log(`  Is Checkmarked Done: ${up.isCompleted ? 'YES ✔' : 'NO ❌'} (${up.totalCompleted}/${up.totalAssigned} problems)`);
            console.log(`  Matched Arenas: ${up.matchedArenas.length}`);
            up.matchedArenas.forEach(a => {
                console.log(`    - Arena: ${a.arenaName} (${a.completed}/${a.total} problems)`);
            });
        });

        console.log('\n[Test] Test completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('[Test] Error during test execution:', error);
        process.exit(1);
    }
}

runTest();
