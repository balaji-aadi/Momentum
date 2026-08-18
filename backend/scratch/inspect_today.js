import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.config.js";
import { DailyRevision } from "../models/dailyRevision.model.js";
import { Task } from "../models/task.model.js";

const run = async () => {
  await connectDB();
  try {
    const revisions = await DailyRevision.find({})
      .sort({ dateStr: -1 })
      .limit(3)
      .populate("questions")
      .populate("completedQuestions");

    console.log("=== LATEST 3 DAILY REVISIONS ===");
    for (const rev of revisions) {
      console.log({
        id: rev._id,
        dateStr: rev.dateStr,
        isStarted: rev.isStarted,
        isCompleted: rev.isCompleted,
        questions: rev.questions.map(q => ({ id: q._id, name: q.taskName, taskId: q.taskId })),
        completedQuestions: rev.completedQuestions.map(q => ({ id: q._id, name: q.taskName }))
      });
    }

    console.log("\n=== REVISIONS LOGGED TODAY (2026-08-16) ===");
    const tasksWithLogs = await Task.find({ "revisionLogs.0": { $exists: true } });
    const todayStr = "2026-08-16";
    for (const t of tasksWithLogs) {
      const todayLogs = t.revisionLogs.filter(l => {
        const d = new Date(l.revisionDate).toISOString().split("T")[0];
        return d === todayStr || d === "2026-08-16";
      });
      if (todayLogs.length > 0) {
        console.log(`Task [${t.taskId}] ${t.taskName}: ${todayLogs.length} logs today:`, todayLogs);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
