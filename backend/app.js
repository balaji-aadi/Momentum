import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import xss from "xss-clean";
import compression from "compression";
import router from "./api-gateway/router.js";
import { whiteListCors } from "./config/cors.js";
import fileUpload from "express-fileupload";
import { socketService } from "./socket-instance.js";
import "./models/permission.model.js";
import { initSprintActivationJob } from "./services/sprint-service/sprintActivation.job.js";
import { initTaskTransitionJob } from "./services/task-service/taskTransition.job.js";
import { repairAllProgress } from "./services/progress-service/repairProgress.js";

const app = express();
// export const socketService = new SocketService(); // Moved to socket-instance.js
export { socketService };

// Middleware setup
app.use(cors({ origin: whiteListCors, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(helmet({ crossOriginResourcePolicy: false }));
// app.use(xss());
app.use(compression());
app.use(express.static("public"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(fileUpload());

// Routes declaration
app.use("/test", (req, res) => {
  res.send("testing");
});

app.use("/api/v1", router);

const httpServer = http.createServer(app);

// function init() {
//   socketService._io.attach(httpServer);

//   socketService.initListeners();

//   // Initialize background jobs
//   initSprintActivationJob();
//   initTaskTransitionJob();

//   // Run data repairs
//   repairAllProgress();
// }

// init();
socketService._io.attach(httpServer);

export default httpServer;
