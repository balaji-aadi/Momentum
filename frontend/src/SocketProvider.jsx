import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { serverUrl } from "./services/config";
import { useSelector } from "react-redux";
import { NotificationApi } from "./services/api/notification.api";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

const SocketProvider = ({ children }) => {
  const user = useSelector((state) => state.store.currentUser);
  const userId = user?._id;
  const [isNotification, setIsNotification] = useState(false);
  const [notificationData, setNotificationData] = useState([]);

  const socket = useMemo(() => {
    return io(serverUrl, {
      transports: ["websocket"],
      secure: true,
    });
  }, []);

  useEffect(() => {
    if (userId) {
      socket.emit("joined", { user, userId });
    }
  }, [userId]);

  const getAllNotification = async () => {
    try {
      const res = await NotificationApi.getAllNotify({
        filter: {
          notificationStatus: false,
        },
      });
      setNotificationData(res.data?.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    socket.on("notification", (data, assign) => {
      if (assign === userId) {
        // setNotificationData(); // Removed to prevent setting undefined
        setIsNotification(true);
        getAllNotification();
      }
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isNotification,
        setIsNotification,
        notificationData,
        setNotificationData,
        getAllNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
