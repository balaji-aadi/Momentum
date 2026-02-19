import { Task } from "../../models/task.model.js";
import { Project } from "../../models/project.model.js";
// import { Comment } from "../../models/comment.model.js"; // If comments exist, else we'll log to activityLogs

export const processPushEvent = async (payload) => {
    const { ref, commits, repository, pusher } = payload;
    const branch = ref.split('/').pop();
    const results = [];
    const repoUrl = repository.html_url || repository.url; // GitHub sends html_url for browser, url for API

    console.log(`Processing push event for ${repository.full_name} (${repoUrl}) on branch ${branch}`);

    // Find Project associated with this Repo
    // Note: We search by exact match. User might have entered "https://github.com/user/repo.git" or without .git
    // For V1, we assume simple string match or simple fuzzy logic could be added later.
    const project = await Project.findOne({ 
        githubRepository: { $regex: new RegExp(repository.full_name, 'i') } 
    });

    if (project) {
        console.log(`Identified Project: ${project.name} (${project.key})`);
    } else {
        console.warn(`No Project found linked to repository: ${repository.full_name}`);
    }

    for (const commit of commits) {
        const { id, message, url, author } = commit;
        const taskIds = extractTaskIds(message);

        console.log(`Commit ${id}: Found task IDs: ${taskIds.join(', ')}`);

        for (const taskId of taskIds) {
            try {
                // Determine if it's a MongoID or ReadableID
                let query;
                if (taskId.match(/^[0-9a-fA-F]{24}$/)) {
                    query = { _id: taskId };
                } else {
                    query = { taskId: taskId };
                }

                const task = await Task.findOne(query);
                if (task) {
                    const updates = determineUpdates(message);
                    let logMessage = `Commit pushed by ${pusher.name}: ${message} (${id.substring(0, 7)})`;
                    
                    if (updates.status) {
                        // Update status if keyword found
                        task.status = updates.status;
                        logMessage += ` - Status changed to ${updates.status}`;
                        
                        task.activityLogs.unshift({
                            oldStatus: task.status, // technically previous status
                            currentStatus: updates.status,
                            user: null, // System/GitHub update
                            date: new Date(),
                            message: `GitHub Integration: Status updated via commit`
                        });
                    }

                    // Add main activity log for the commit
                    task.activityLogs.unshift({
                        user: null, // System
                        date: new Date(),
                        message: logMessage
                    });
                    
                    // Add generic "linked commit" logic if we had a dedicated field, 
                    // for now we use activityLogs and potentially a new 'linkedCommits' field if helpful.
                    // But activityLogs is good for visibility.

                    await task.save();
                    results.push({ taskId, status: 'updated', updates });
                } else {
                     results.push({ taskId, status: 'not_found' });
                }
            } catch (error) {
                console.error(`Error processing task ${taskId}:`, error);
                results.push({ taskId, status: 'error', error: error.message });
            }
        }
    }
    return results;
};

export const extractTaskIds = (message) => {
    // Matches Readable IDs (e.g. MOM-123) OR Mongo Objects IDs
    const readableIdRegex = /\b[A-Z]+-\d+\b/g;
    const mongoIdRegex = /\b[a-f0-9]{24}\b/g;
    
    const readableMatches = message.match(readableIdRegex) || [];
    const mongoMatches = message.match(mongoIdRegex) || [];
    
    return [...new Set([...readableMatches, ...mongoMatches])];
};

export const determineUpdates = (message) => {
    const lowerMsg = message.toLowerCase();
    const updates = {};

    // Strict keyword matching
    if (lowerMsg.includes('#done') || lowerMsg.includes('closes #') || lowerMsg.includes('fixes #')) {
        updates.status = 'done';
    } else if (lowerMsg.includes('#inprogress') || lowerMsg.includes('#wip')) {
        updates.status = 'inprogress';
    } else if (lowerMsg.includes('#hold')) {
        updates.status = 'hold';
    }

    return updates;
};
