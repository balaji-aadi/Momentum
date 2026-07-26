import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.config.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { FocusSession } from "../models/focusSession.model.js";
import moment from "moment";

async function run() {
  await connectDB();
  console.log("Connected to DB.");

  const dsaProject = await Project.findOne({ name: { $regex: /DSA Phase 2/i } });
  if (!dsaProject) {
    console.log("DSA Phase 2 project not found");
    process.exit(1);
  }

  console.log(`DSA Phase 2 Project ID: ${dsaProject._id}`);

  // Fetch all tasks for DSA Phase 2
  const tasks = await Task.find({ projectName: dsaProject._id });
  console.log(`Total tasks in DSA Phase 2: ${tasks.length}`);

  const dateMap = {};

  tasks.forEach(t => {
    // 1. Done tasks
    if (t.status === "done") {
      let doneDate = t.createdAt;
      if (t.activityLogs && t.activityLogs.length > 0) {
        const doneLog = [...t.activityLogs].reverse().find(l => l.currentStatus === "done");
        if (doneLog && doneLog.date) {
          doneDate = doneLog.date;
        }
      }
      const dStr = moment.utc(doneDate).format("YYYY-MM-DD");
      if (!dateMap[dStr]) {
        dateMap[dStr] = { hoursLogged: 0, tasksCompleted: 0, storyPointsDone: 0, revisionsCount: 0 };
      }
      dateMap[dStr].tasksCompleted += 1;
      dateMap[dStr].storyPointsDone += (t.storyPoints || 0);
    }

    // 2. Revision logs
    if (t.revisionLogs && t.revisionLogs.length > 0) {
      t.revisionLogs.forEach(rl => {
        if (rl.revisionDate) {
          const rStr = moment.utc(rl.revisionDate).format("YYYY-MM-DD");
          if (!dateMap[rStr]) {
            dateMap[rStr] = { hoursLogged: 0, tasksCompleted: 0, storyPointsDone: 0, revisionsCount: 0 };
          }
          dateMap[rStr].revisionsCount += 1;
        }
      });
    }
  });

  // Focus sessions
  const sessions = await FocusSession.find({}).populate({
    path: "task",
    match: { projectName: dsaProject._id }
  });

  sessions.forEach(s => {
    if (s.task && s.duration) {
      const dStr = moment.utc(s.date || s.startTime).format("YYYY-MM-DD");
      if (!dateMap[dStr]) {
        dateMap[dStr] = { hoursLogged: 0, tasksCompleted: 0, storyPointsDone: 0, revisionsCount: 0 };
      }
      dateMap[dStr].hoursLogged += Number((s.duration / 60).toFixed(2));
    }
  });

  console.log("=== Dynamic Consistency Stats for DSA Phase 2 (July 2026) ===");
  Object.keys(dateMap).sort().forEach(dStr => {
    if (dStr.startsWith("2026-07")) {
      const m = dateMap[dStr];
      console.log(`Date: ${dStr} | Tasks: ${m.tasksCompleted} | Revisions: ${m.revisionsCount} | Focus: ${m.hoursLogged}h | Points: ${m.storyPointsDone}`);
    }
  });

  process.exit(0);
}

run().catch(console.error);
