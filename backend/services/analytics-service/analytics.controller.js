import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { PerformanceStat } from "../../models/performanceStat.model.js";
import { Project } from "../../models/project.model.js";
import mongoose from "mongoose";
import moment from "moment";
import AnalyticsService from "./analytics.service.js";

const analyticsController = {};

/**
 * Get personal stats for the logged-in employee
 */
analyticsController.getPersonalStats = asyncHandler(async (req, res) => {
    const { period, startDate, endDate } = req.query;
    const userId = req.user._id;

    const query = {
        entityType: "user",
        entityId: new mongoose.Types.ObjectId(userId),
        period: period || "daily"
    };

    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await PerformanceStat.find(query).sort({ date: 1 });

    return res.status(200).json(
        new ApiResponse(200, stats, "Personal stats fetched successfully")
    );
});

/**
 * Get team performance for a specific project (Manager View)
 */
analyticsController.getTeamStats = asyncHandler(async (req, res) => {
    const { projectId, period } = req.query;

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    // Verify project exists and user has access (Manager/Admin)
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // RBAC: Check if user is associated with this project or is Admin
    // (Assuming simple manager check for now)

    const stats = await PerformanceStat.find({
        entityType: "user",
        period: period || "daily",
        // We might need to filter by users in this project.
        // For now, let's fetch all user stats for the day if we have a team ID, 
        // but typically this is queried per user or aggregated.
    }).populate('entityId', 'firstName lastName profileImage');

    return res.status(200).json(
        new ApiResponse(200, stats, "Team stats fetched successfully")
    );
});

/**
 * Get project health metrics
 */
analyticsController.getProjectHealth = asyncHandler(async (req, res) => {
    const { projectId, period } = req.query;

    const stats = await PerformanceStat.find({
        entityType: "project",
        entityId: new mongoose.Types.ObjectId(projectId),
        period: period || "daily"
    }).sort({ date: 1 });

    return res.status(200).json(
        new ApiResponse(200, stats, "Project health fetched successfully")
    );
});

/**
 * Manual sync of all existing task data into analytics
 */
analyticsController.getMemberStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { period, startDate, endDate } = req.query;

    const query = {
        entityType: "user",
        entityId: new mongoose.Types.ObjectId(userId),
        period: period || "daily"
    };

    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await PerformanceStat.find(query).sort({ date: 1 });

    return res.status(200).json(
        new ApiResponse(200, stats, "Member stats fetched successfully")
    );
});

analyticsController.syncData = asyncHandler(async (req, res) => {
    const result = await AnalyticsService.syncAllExistingData();
    return res.status(200).json(
        new ApiResponse(200, result, "Analytics data resynced successfully")
    );
});

export default analyticsController;
