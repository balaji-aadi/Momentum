// import "dotenv/config";
// import httpServer from "./app.js";
// import connectDB from "./config/db.config.js";
// // import { seedRoles } from "./models/role.model.js";

// const PORT = process.env.PORT || 5001;

// connectDB()
//   .then(async () => {
//     // Seed roles after DB connection
//     // await seedRoles();
    
//     httpServer.listen(PORT, () => {
//       console.log(`Server is running at http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log("MONGODB connection failed !!! ", err);
//   });


import "dotenv/config";
import httpServer, { socketService } from "./app.js";
import connectDB from "./config/db.config.js";
import { initSprintActivationJob } from "./services/sprint-service/sprintActivation.job.js";
import { initTaskTransitionJob } from "./services/task-service/taskTransition.job.js";
import { repairAllProgress } from "./services/progress-service/repairProgress.js";

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    httpServer.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on port ${PORT} across all network interfaces (0.0.0.0)`);

      // Initialize socket listeners
      socketService.initListeners();

      // Run background jobs AFTER server starts
      initSprintActivationJob();
      initTaskTransitionJob();

      // Optional: run repair task in background
      repairAllProgress().catch(err => console.error("Repair background error:", err));
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });