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

    // Execute sync after connection settles
    setTimeout(() => {
        PamphletSyncService.syncAllUsers().catch(e => console.error('[PamphletSync] Startup sync error:', e));
    }, 5000);
};
