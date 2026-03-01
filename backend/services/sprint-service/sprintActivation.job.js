import cron from 'node-cron';
import { Sprint } from '../../models/sprint.model.js';
import { Notification } from '../../models/notification.model.js';
import { socketService } from '../../socket-instance.js';
import notificationService from '../notification-service/notification.service.js';
import mongoose from 'mongoose';

/**
 * Initializes the sprint activation cron job.
 * Runs every day at midnight (00:00).
 */
export const initSprintActivationJob = () => {
    // Run every day at 00:00 (Midnight)
    // For testing/initialization, we can also run it immediately or more frequently
    // '0 0 * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running Sprint Activation Job...');
        await activateSprints();
    });

    // Also run once on startup to catch any sprints that should have started while server was down
    activateSprints();
};

/**
 * Finds planned sprints that should be active and updates them.
 */
const activateSprints = async () => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Inclusion check for today

        // Find sprints that are 'planned' and their startDate <= today
        const sprintsToActivate = await Sprint.find({
            status: 'planned',
            startDate: { $lte: today }
        });

        if (sprintsToActivate.length === 0) {
            console.log('[Cron] No sprints to activate today.');
            return;
        }

        console.log(`[Cron] Activating ${sprintsToActivate.length} sprints...`);

        for (const sprint of sprintsToActivate) {
            sprint.status = 'active';
            await sprint.save();

            console.log(`[Cron] Activated sprint: ${sprint.name} (${sprint._id})`);

            // Send Notification to Creator
            if (sprint.createdBy) {
                try {
                    const title = "Sprint Activated";
                    const messageString = `Your sprint "${sprint.name}" has automatically started.`;
                    
                    await Notification.create({
                        senderId: sprint.createdBy, // System action, but use creator for context if needed or a dedicated system ID
                        receiverId: sprint.createdBy,
                        title: title,
                        message: messageString,
                        projectId: sprint.project,
                    });

                    const socketMessage = { title, body: messageString };
                    socketService._io.emit("notification", socketMessage, sprint.createdBy.toString());
                    await notificationService(sprint.createdBy, socketMessage);
                } catch (notifyErr) {
                    console.error(`[Cron] Notification error for sprint ${sprint._id}:`, notifyErr);
                }
            }
        }
    } catch (error) {
        console.error('[Cron] Error in sprint activation process:', error);
    }
};
