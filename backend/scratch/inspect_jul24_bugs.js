import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.config.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { PerformanceStat } from "../models/performanceStat.model.js";
import { FocusSession } from "../models/focusSession.model.js";
import moment from "moment";

async function run() {
  await connectDB();
  console.log("Connected to DB.");

  const perfStats = await PerformanceStat.find({
    date: {
      $gte: new Date("2026-07-24T00:00:00.000Z"),
      $lte: new Date("2026-07-24T23:59:59.999Z")
    }
  });

  console.log("=== Performance Stats for 2026-07-24 ===");
  perfStats.forEach(s => {
    console.log(`Type: ${s.entityType}, ID: ${s.entityId}, Period: ${s.period}, Metrics:`, s.metrics);
  });

  // Find all projects
  const dsaProject = await Project.findOne({ name: { $regex: /DSA Phase 2/i } });
  if (dsaProject) {
    console.log(`DSA Phase 2 Project ID: ${dsaProject._id}`);
    const dsaTasks = await Task.find({ projectName: dsaProject._id });
    console.log(`Total tasks in DSA Phase 2: ${dsaTasks.length}`);

    // Check tasks updated or with activity logs on July 24
    const jul24Tasks = dsaTasks.filter(t => {
      const uDate = moment(t.updatedAt).format("YYYY-MM-DD");
      const cDate = moment(t.createdAt).format("YYYY-MM-DD");
      const hasJul24Log = (t.activityLogs || []).some(l => moment(l.date).format("YYYY-MM-DD") === "2026-07-24");
      return uDate === "2026-07-24" || cDate === "2026-07-24" || hasJul24Log;
    });

    console.log(`Tasks touched on July 24 in DSA Phase 2: ${jul24Tasks.length}`);
    jul24Tasks.forEach(t => {
      console.log(`- Task [${t.taskId}] "${t.taskName}" | Status: ${t.status} | Created: ${t.createdAt} | Updated: ${t.updatedAt}`);
      console.log(`  ActivityLogs:`, t.activityLogs);
    });
  }

  // Check any negative tasks completed across all PerformanceStat
  const negStats = await PerformanceStat.find({ "metrics.tasksCompleted": { $lt: 0 } });
  console.log(`=== Negative Tasks Completed Stats Count: ${negStats.length} ===`);
  negStats.forEach(s => {
    console.log(`Entity: ${s.entityType} ${s.entityId}, Date: ${s.date}, Metrics:`, s.metrics);
  });

  process.exit(0);
}

run().catch(console.error);
