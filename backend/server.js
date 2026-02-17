import "dotenv/config";
import httpServer from "./app.js";
import connectDB from "./config/db.config.js";
import { seedRoles } from "./models/role.model.js";

const PORT = process.env.PORT || 5001;

connectDB()
  .then(async () => {
    // Seed roles after DB connection
    await seedRoles();
    
    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });
