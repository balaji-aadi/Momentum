import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model.js";
import { Branch } from "./models/branch.model.js";
import taskController from "./services/task-service/task.controller.js";

dotenv.config();

async function traceApi() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Real MongoDB");

  const testUser = await User.findOne({ email: "test@gmail.com" }).lean();
  const branch = await Branch.findOne({ name: /Software Development/i }).lean();

  let responseData = null;
  const mockRes = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { responseData = payload; return this; }
  };

  const req = {
    user: testUser,
    branchId: branch._id,
    body: {
      filter: {
        projectName: "69d7788e6d3910f342f371d9"
      }
    },
    query: {}
  };

  await new Promise((resolve) => {
    mockRes.json = function(payload) {
      responseData = payload;
      resolve();
      return this;
    };
    taskController.getallTasks(req, mockRes);
  });

  console.log("Total tasks returned:", responseData?.data?.length);
  const tasksToInspect = responseData?.data?.filter(t => ["DSA-73", "DSA-51", "DSA-173"].includes(t.taskId));
  for (const t of tasksToInspect) {
    console.log(`\n--- API Response for ${t.taskId} ---`);
    console.log("taskId:", t.taskId);
    console.log("taskName:", t.taskName);
    console.log("status:", t.status);
    console.log("progress:", t.progress);
    console.log("taskStartDate:", t.taskStartDate);
    console.log("taskDueDate:", t.taskDueDate);
    console.log("parentTask:", t.parentTask);
    console.log("estimatedHours:", t.estimatedHours);
    console.log("subtaskStats:", t.subtaskStats);
  }

  await mongoose.disconnect();
}

traceApi().catch(console.error);
