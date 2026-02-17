import React, { useContext, useEffect, useRef, useState } from "react";
import { FaBars, FaUser, FaPowerOff } from "react-icons/fa";
import { BiBell } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoMdQrScanner } from "react-icons/io";
import avatar from "../../assets/no_logo2.png";
import { ToggleContext } from "../store/LayoutHook";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/storeSlice";
import { useLoading } from "../loader/LoaderContext";
import DarkModeToggle from "../DarkModeToggle";
import { messaging } from "../../firebaseConfig";
import { getToken } from "firebase/messaging";
import { UserApi } from "../../services/api/user.api";
import { NotificationApi } from "../../services/api/notification.api";
import moment from "moment/moment";
import { useSocket } from "../../SocketProvider";
import "./topbar.style.css";

const Topbar = () => {
  const [isProfile, setIsProfile] = useState(false);
  const {
    isNotification,
    setIsNotification,
    notificationData,
    getAllNotification,
  } = useSocket();
  const { toggle } = useContext(ToggleContext);
  const { currentUser } = useSelector((state) => state.store);
  const { handleLoading } = useLoading();
  const profileRef = useRef();
  const notificationRef = useRef();
  const router = useNavigate();
  const dispatch = useDispatch();

  const notificationIconClass = isNotification ? "shake" : "";

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  const handleNavigateToNotification = () => {
    router("/notification");
  };

  const handleLogout = async () => {
    handleLoading(true);
    try {
      dispatch(logout());
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const handleUpdateNotify = async (data) => {
    const id = data?._id;

    if (
      data?.title === "Task created for you" ||
      data?.title === "Task updated for you"
    ) {
      router(`/task/dashboard?projectId=${data?.projectId?._id}`);
    } else if (
      data?.title === "Test created for you" ||
      data?.title === "Test updated for you"
    ) {
      router(
        `/testing/my-task?type=Test Case&projectId=${data?.projectId?._id}`
      );
    } else if (
      data?.title === "Bug created for you" ||
      data?.title === "Bug updated for you"
    ) {
      router(
        `/testing/my-task?type=Bug Reporting&projectId=${data?.projectId?._id}`
      );
    }
    try {
      await NotificationApi.updateStatus(id);
      setTimeout(() => {
        getAllNotification();
      }, 1000);
    } catch (err) {
      console.log(err);
    }
  };

  const renderAssigneeImage = () => {
    if (currentUser?.profileImage) {
      return (
        <img
          src={currentUser?.profileImage}
          alt={currentUser?.firstName}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    } else {
      const firstLetter = currentUser?.firstName.charAt(0).toUpperCase();
      const colors = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-purple-500",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      return (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${randomColor}`}
        >
          {firstLetter}
        </div>
      );
    }
  };

  // Add these functions to your component

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationApi.markAllAsRead();
      getAllNotification();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const groupNotificationsByDay = (notifications) => {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    notifications.forEach(notification => {
      const notificationDate = moment(notification.createdAt);
      let dateLabel;

      if (notificationDate.isSame(today, 'd')) {
        dateLabel = 'Today';
      } else if (notificationDate.isSame(yesterday, 'd')) {
        dateLabel = 'Yesterday';
      } else if (notificationDate.isAfter(moment().subtract(7, 'days'))) {
        dateLabel = notificationDate.format('dddd');
      } else {
        dateLabel = notificationDate.format('MMM D, YYYY');
      }

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        currentGroup = {
          dateLabel,
          notifications: []
        };
        groups.push(currentGroup);
      }

      currentGroup.notifications.push(notification);
    });

    return groups;
  };

  //notification logic here

  const requestPermission = async (userId) => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registered successfully:", registration);

      const token = await getToken(messaging, {
        vapidKey:
          "BPuhQ5iZ4rOcxGmyJ5mEcItRY2RlzEKhzwHC9RwTIbvD694R4p_xdGen-C--tULAPhVUmb_kfMOQcjy5NIOzKzw",
      });

      if (token) {
        const payload = {
          user_id: userId || null,
          fcm_token: token,
          device_type: "web",
        };

        (async () => {
          handleLoading(true);
          try {
            const res = await UserApi.saveFcmToken(payload);
            console.log("This is the response of the fcm token ", res.data);
          } catch (err) {
            console.log(err);
          } finally {
            handleLoading(false);
          }
        })();
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
  };

  useEffect(() => {
    getAllNotification();
  }, []);

  useEffect(() => {
    requestPermission(currentUser?._id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="topbar_container z-50 dark:bg-themeBG dark:text-themeText bg-white sticky top-0 border-b border-gray-200 shadow-md p-4 flex justify-between items-center">
      <FaBars onClick={toggle} className="text-lg cursor-pointer" />

      <div className="flex items-center space-x-4 mr-5">
        <DarkModeToggle />
        <IoMdQrScanner
          className="text-xl cursor-pointer hover:text-gray-600"
          onClick={toggleFullScreen}
        />

        <div className="relative" ref={notificationRef}>
          <div
            className={`relative cursor-pointer p-2 rounded-full hover:bg-gray-100 hover:dark:text-black ${notificationIconClass}`}
            onMouseEnter={() => setIsNotification(true)}
          >
            <BiBell className="text-xl" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
              {notificationData?.length}
            </span>
          </div>

          {isNotification && (
            <div
              className="absolute top-14 right-0 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
              onMouseEnter={() => setIsNotification(true)}
              onMouseLeave={() => setIsNotification(false)}
            >

              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="font-semibold text-lg text-gray-800 dark:text-white">
                  Notifications
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    disabled={notificationData?.length === 0}
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={handleNavigateToNotification}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all
                  </button>
                </div>
              </div>

              {/* Notification Content */}
              {notificationData?.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {groupNotificationsByDay(notificationData).map((group, groupIndex) => (
                    <div key={groupIndex} className="px-2">
                      <div className="sticky top-0 px-2 py-1 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 z-10">
                        {group.dateLabel}
                      </div>
                      {group.notifications.map((data, index) => (
                        <div
                          key={index}
                          className={`p-3 cursor-pointer transition-colors duration-150 ${!data.notificationStatus
                            ? 'bg-blue-50/50 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          onClick={() => handleUpdateNotify(data)}
                        >
                          <div className="flex space-x-3">
                            <div className="relative">
                              {data.senderId?.profileImage ? (
                                <img
                                  src={data.senderId.profileImage}
                                  alt="User Avatar"
                                  className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white font-medium">
                                  {data.senderId?.firstName?.charAt(0) || 'U'}
                                </div>
                              )}
                              {!data.notificationStatus && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {data.senderId.firstName} {data.senderId.lastName}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {moment(data.createdAt).format("h:mm A")}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {data.title}{' '}
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  @ {data.projectId?.name}
                                </span>
                              </p>

                              {data.message && (
                                <div className="mt-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                  {data.message}
                                </div>
                              )}

                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {moment(data.createdAt).fromNow()}
                                </span>
                                {data.projectId?.priority && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${data.projectId.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    data.projectId.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                    {data.projectId.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={profileRef}>
          <div
            className="flex items-center cursor-pointer space-x-2"
            onClick={() => setIsProfile(!isProfile)}
          >
            {renderAssigneeImage()}
            <BsThreeDotsVertical className="text-xl" />
          </div>
          {isProfile && (
            <div className="absolute top-16 right-2 dark:bg-themeBG dark:text-themeText border-white border-2 bg-white shadow-lg rounded-lg w-auto p-3">
              <div className="flex items-center space-x-3 border-b pb-3">
                {renderAssigneeImage()}
                <div className="text-sm">
                  <p className="font-semibold">
                    {" "}
                    {currentUser && currentUser?.firstName}{" "}
                    {currentUser && currentUser?.lastName}{" "}
                  </p>
                  <p className="text-gray-500">
                    {currentUser && currentUser?.email}
                  </p>
                  <p className="capitalize text-sm">
                    {currentUser &&
                      currentUser?.userRole?.name === "projectmanager"
                      ? "Project Manager"
                      : currentUser?.userRole?.name}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {/* <Link
                  to={"/profile"}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:text-black p-2 rounded-lg"
                >
                  <FaUser /> <span>Profile</span>
                </Link> */}
                {/* <p className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:text-black p-2 rounded-lg">
                  <FaCog /> <span>Settings</span>
                </p> */}
                <p
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg text-red-500"
                  onClick={handleLogout}
                >
                  <FaPowerOff /> <span>Logout</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
