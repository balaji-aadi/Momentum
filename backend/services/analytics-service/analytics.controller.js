import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { PerformanceStat } from "../../models/performanceStat.model.js";
import { Project } from "../../models/project.model.js";
import mongoose from "mongoose";
import moment from "moment";
import AnalyticsService from "./analytics.service.js";

const analyticsController = {};

/**
 * Get personal stats for the logged-in employee (Dynamic Calculation)
 */
analyticsController.getPersonalStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;
    let stats = await AnalyticsService.getUserConsistencyStats(userId);

    if (startDate && endDate) {
        const start = moment.utc(startDate).startOf('day');
        const end = moment.utc(endDate).endOf('day');
        stats = stats.filter(s => {
            const m = moment.utc(s.date);
            return m.isSameOrAfter(start, 'day') && m.isSameOrBefore(end, 'day');
        });
    }

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

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    const stats = await PerformanceStat.find({
        entityType: "user",
        branchId: req.branchId,
        period: period || "daily",
    }).populate('entityId', 'firstName lastName profileImage');

    return res.status(200).json(
        new ApiResponse(200, stats, "Team stats fetched successfully")
    );
});

/**
 * Get project health metrics (Dynamic Calculation)
 */
analyticsController.getProjectHealth = asyncHandler(async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    const stats = await AnalyticsService.getProjectConsistencyStats(projectId);

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
        branchId: req.branchId,
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

/**
 * Get detailed day breakdown of completed problems, revisions, focus time for a specific date
 */
analyticsController.getDayDetails = asyncHandler(async (req, res) => {
    const { date, projectId } = req.query;

    if (!date) {
        return res.status(400).json({ message: "Date is required (format: YYYY-MM-DD)" });
    }

    const details = await AnalyticsService.getDayDetails(req.user._id, date, projectId, req.branchId);

    return res.status(200).json(
        new ApiResponse(200, details, "Day activity details fetched successfully")
    );
});

export default analyticsController;
