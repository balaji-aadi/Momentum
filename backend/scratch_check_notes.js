import mongoose from "mongoose";
import dotenv from "dotenv";
import { Note } from "./models/note.model.js";
import { Task } from "./models/task.model.js";
import { User } from "./models/user.model.js";

dotenv.config();

const connectionUri = process.env.DB_NAME
  ? `${process.env.MONGODB_URI}/${process.env.DB_NAME}?authSource=admin`
  : process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(connectionUri, { family: 4, serverSelectionTimeoutMS: 30000 });
  
  const totalNotes = await Note.countDocuments();
  console.log("Total Notes in DB:", totalNotes);
  
  const allNotes = await Note.find({}).lean();
  console.log("Sample Notes:", allNotes.slice(0, 10).map(n => ({
    _id: n._id,
    userId: n.userId,
    title: n.title,
    taskId: n.taskId,
    taskIds: n.taskIds,
    hasContent: !!n.content
  })));

  const dsa6 = await Task.findOne({ taskId: "DSA-6" }).lean();
  console.log("DSA-6 Task:", dsa6 ? {
    _id: dsa6._id,
    taskId: dsa6.taskId,
    taskName: dsa6.taskName,
    additionalNotes: dsa6.additionalNotes
  } : "Not found");

  if (dsa6) {
    const linkedNotes = await Note.find({
      $or: [
        { taskId: dsa6._id },
        { taskIds: dsa6._id }
      ]
    }).lean();
    console.log("Notes linked to DSA-6 (_id):", linkedNotes.length, linkedNotes);
  }

  // Also check if notes are linked to other DSA tasks
  const dsaTasksWithNotes = [];
  for (const n of allNotes) {
    if (n.taskId) {
      const t = await Task.findById(n.taskId).lean();
      if (t) {
        dsaTasksWithNotes.push({ noteTitle: n.title, taskId: t.taskId, taskName: t.taskName, noteUserId: n.userId });
      }
    }
  }
  console.log("Notes linked to any tasks:", dsaTasksWithNotes);

  await mongoose.disconnect();
}

check().catch(console.error);
