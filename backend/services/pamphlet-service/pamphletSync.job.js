import cron from 'node-cron';
import { PamphletSyncService } from './pamphletSync.service.js';

/**
 * Initializes the automated 2-day multi-arena DSA Pamphlet progress sync cron job.
 */
export const initPamphletSyncJob = () => {
    // Run every 2 days at midnight: '0 0 */2 * *'
    cron.schedule('0 0 */2 * *', async () => {
        console.log('[Cron Job] Executing 2-Day Automated Multi-Arena Pamphlet Progress Sync...');
        await PamphletSyncService.syncAllUsers();
    });

    // Execute sync on server startup
    PamphletSyncService.syncAllUsers();
};
