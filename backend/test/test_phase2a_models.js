import mongoose from "mongoose";
import { UserTaskProgress } from "../models/userTaskProgress.model.js";
import { UserArenaSchedule } from "../models/userArenaSchedule.model.js";

async function validatePhase2AModels() {
    console.log("=== Validating Phase 2A Models ===");
    
    // 1. Validate UserTaskProgress Schema
    if (!UserTaskProgress || !UserTaskProgress.schema) {
        throw new Error("UserTaskProgress model failed to initialize!");
    }
    console.log("✅ UserTaskProgress model initialized successfully.");
    
    const taskProgressIndexes = UserTaskProgress.schema.indexes();
    console.log("UserTaskProgress Indexes:", JSON.stringify(taskProgressIndexes, null, 2));
    
    const hasTaskUniqueIndex = taskProgressIndexes.some(idx => 
        idx[0].userId === 1 && idx[0].taskId === 1 && idx[1]?.unique === true
    );
    if (!hasTaskUniqueIndex) {
        throw new Error("UserTaskProgress missing unique compound index { userId: 1, taskId: 1 }!");
    }
    console.log("✅ UserTaskProgress has verified unique compound index { userId: 1, taskId: 1 }.");

    // 2. Validate UserArenaSchedule Schema
    if (!UserArenaSchedule || !UserArenaSchedule.schema) {
        throw new Error("UserArenaSchedule model failed to initialize!");
    }
    console.log("✅ UserArenaSchedule model initialized successfully.");
    
    const arenaScheduleIndexes = UserArenaSchedule.schema.indexes();
    console.log("UserArenaSchedule Indexes:", JSON.stringify(arenaScheduleIndexes, null, 2));
    
    const hasArenaUniqueIndex = arenaScheduleIndexes.some(idx => 
        idx[0].userId === 1 && idx[0].projectId === 1 && idx[1]?.unique === true
    );
    if (!hasArenaUniqueIndex) {
        throw new Error("UserArenaSchedule missing unique compound index { userId: 1, projectId: 1 }!");
    }
    console.log("✅ UserArenaSchedule has verified unique compound index { userId: 1, projectId: 1 }.");

    console.log("\n=== Phase 2A Model Validation PASSED Cleanly ===");
}

validatePhase2AModels().catch(err => {
    console.error("❌ Phase 2A Validation Error:", err);
    process.exit(1);
});
