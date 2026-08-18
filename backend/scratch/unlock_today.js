import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.config.js";
import { DailyRevision } from "../models/dailyRevision.model.js";

const run = async () => {
  await connectDB();
  try {
    // Find today's revision (2026-08-16) or any active uncompleted revision
    const uncompletedRevisions = await DailyRevision.find({
      $or: [
        { dateStr: "2026-08-16" },
        { isCompleted: false }
      ]
    });

    console.log(`Found ${uncompletedRevisions.length} revision document(s) to unlock/complete:`);

    for (const rev of uncompletedRevisions) {
      rev.isStarted = true;
      rev.isCompleted = true;
      rev.timerIsActive = false;
      if (!rev.completedQuestions || rev.completedQuestions.length === 0) {
        rev.completedQuestions = rev.questions;
      }
      await rev.save();
      console.log(`Updated DailyRevision ID ${rev._id} (dateStr: ${rev.dateStr}): set isStarted=true, isCompleted=true`);
    }

    console.log("Daily revision gate successfully unlocked for today!");
  } catch (err) {
    console.error("Error unlocking daily revision:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
