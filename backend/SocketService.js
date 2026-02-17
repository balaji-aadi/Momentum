import { Server } from "socket.io";
import { whiteListCors } from "./config/cors.js";

class SocketService {
  constructor() {
    console.log("Initializing socket server...");
    this._io = new Server({
      cors: {
        origin: whiteListCors,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
  }

  initListeners = () => {
    const io = this._io;

    console.log("Initializing socket listeners...");
    io.on("connect", (socket) => {
      socket.on("joined", async ({ user, userId }) => {
        try {
          console.log(`${user?.firstName} has joined with user id ${userId}`);
        } catch (err) {
          console.log(err);
        }
      });
    });
  };
}

export default SocketService;
