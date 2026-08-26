import { FocusSession } from "../../models/focusSession.model.js";
import AnalyticsService from "../analytics-service/analytics.service.js";

export const FocusController = {
  createSession: async (req, res) => {
    try {
      const userId = req.user._id;
      const { startTime, endTime, duration, type, date, task, taskName, taskIdString, statusAtCompletion, completionState, estimatedTimeAtStart, backlogTimeAdded, isBacklog, originalDueDate } = req.body;
      const session = new FocusSession({
        user: userId,
        startTime,
        endTime,
        duration,
        type,
        date: date || new Date(),
        task,
        taskName,
        taskIdString,
        statusAtCompletion,
        completionState,
        estimatedTimeAtStart,
        backlogTimeAdded,
        isBacklog,
        originalDueDate,
        branchId: req.branchId
      });
      await session.save();

      // Update Analytics
      await AnalyticsService.recordFocusTime(userId, duration, session.date, req.branchId, task);

      res.status(201).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteSession: async (req, res) => {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const session = await FocusSession.findOneAndDelete({ _id: id, user: userId });
      if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }

      // Update Analytics
      await AnalyticsService.removeFocusTime(userId, session.duration, session.date, session.branchId, session.task);

      res.status(200).json({ success: true, message: "Session deleted successfully" });
    } catch (error) {
       res.status(500).json({ success: false, message: error.message });
    }
  },

  getSessions: async (req, res) => {
    try {
      const userId = req.user._id;
      const { limit } = req.query;
      const sessions = await FocusSession.find({ 
        user: userId,
        branchId: req.branchId 
      })
      .sort({ date: -1 })
      .limit(limit ? parseInt(limit) : 0);

      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getTodayStats: async (req, res) => {
    try {
      const userId = req.user._id;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const query = {
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      };
      if (req.branchId) {
        query.branchId = req.branchId;
      }

      const sessions = await FocusSession.find(query);

      const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      res.status(200).json({
        success: true,
        data: {
          sessionsCount: sessions.length,
          totalDuration,
          totalMinutes: totalDuration,
          sessions,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
