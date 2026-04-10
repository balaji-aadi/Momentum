import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { DailyAccountability } from "../../models/dailyAccountability.model.js";
import { PerformanceStat } from "../../models/performanceStat.model.js";
import mongoose from "mongoose";

const dailyAccountabilityController = {};

/**
 * Retrieves the daily accountability topic board for the authenticated user.
 */
dailyAccountabilityController.getBoard = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    let board = await DailyAccountability.findOne({ userId });
    
    if (!board) {
        board = await DailyAccountability.create({ userId, sections: [] });
    }
    
    return res.status(200).json(
        new ApiResponse(200, board, "Board fetched successfully")
    );
});

/**
 * Saves and overwrites the entire board layout for the user.
 * Additionally acts as an activity signal tracking daily global consistency.
 */
dailyAccountabilityController.saveBoard = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { sections } = req.body;
    
    let board = await DailyAccountability.findOne({ userId });
    
    if (!board) {
        board = await DailyAccountability.create({ userId, sections: sections || [] });
    } else {
        board.sections = sections || [];
        await board.save();
    }
    
    // 4 AM Logical Day Bound Hook
    const now = new Date();
    const logicalDate = new Date(now);
    // If before 4 AM, this entry belongs to the previous day
    if (now.getHours() < 4) {
         logicalDate.setDate(logicalDate.getDate() - 1);
    }
    logicalDate.setHours(0, 0, 0, 0); 
    
    // Count total logs that map to this logic day across ALL sections
    const dateStr = [
        logicalDate.getFullYear(), 
        String(logicalDate.getMonth() + 1).padStart(2, '0'), 
        String(logicalDate.getDate()).padStart(2, '0')
    ].join('-');
    
    let totalLogsForLogicalDay = 0;
    const safeSections = sections || [];
    safeSections.forEach(sec => {
        (sec.rows || []).forEach(row => {
            if (row.date === dateStr) {
                 totalLogsForLogicalDay++;
            }
        });
    });
    
    await PerformanceStat.findOneAndUpdate(
        {
            entityType: 'user',
            entityId: new mongoose.Types.ObjectId(userId),
            period: 'daily',
            date: logicalDate
        },
        {
            $set: { "metrics.accountabilityLogs": totalLogsForLogicalDay } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    return res.status(200).json(
        new ApiResponse(200, board, "Board synced to database and consistency updated efficiently.")
    );
});

export default dailyAccountabilityController;
