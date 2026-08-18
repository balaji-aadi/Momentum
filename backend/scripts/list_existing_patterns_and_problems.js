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

async function listExisting() {
    try {
        await mongoose.connect(MONGODB_URI);
        const result = await PamphletSyncService.syncUserPamphlet(USER_ID);

        const existingPatterns = result.patterns.filter(p => p.userProgress.totalAssigned > 0);

        console.log(`=== EXISTING PATTERNS AND PROBLEMS IN DB (${existingPatterns.length} PATTERNS) ===\n`);

        existingPatterns.forEach((p, idx) => {
            console.log(`${idx + 1}. [${p.topic}] ${p.patternName} (${p.userProgress.totalCompleted}/${p.userProgress.totalAssigned} Problems Done)`);
            
            p.userProgress.matchedArenas.forEach(arena => {
                console.log(`   📁 Arena: ${arena.arenaName} (${arena.completed}/${arena.total})`);
                arena.problems.forEach((prob, pIdx) => {
                    const icon = prob.isCompleted ? '✔' : '❌';
                    console.log(`      ${pIdx + 1}. ${icon} ${prob.taskName} [${prob.status}]`);
                });
            });
            console.log('');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listExisting();
