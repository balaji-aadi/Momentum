import React, { useEffect, useState, useRef } from 'react';
import { IoNotificationsOutline, IoSearchOutline, IoCalendarOutline } from 'react-icons/io5';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectApi } from '../../services/api/Project.api';
import { useSocket } from '../../SocketProvider';
import { NotificationApi } from '../../services/api/notification.api';
import { UserApi } from '../../services/api/user.api';
import { messaging } from '../../firebaseConfig';
import { getToken } from 'firebase/messaging';
import { useSelector } from 'react-redux';
import { useLoading } from '../loader/LoaderContext';
import moment from 'moment';

const Header = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [projectName, setProjectName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationRef = useRef();
  
  const {
    isNotification,
    setIsNotification,
    notificationData,
    getAllNotification,
  } = useSocket();
  
  const { currentUser } = useSelector((state) => state.store);
  const { handleLoading } = useLoading();

  useEffect(() => {
    const fetchProjectName = async () => {
        if (projectId) {
            try {
                const res = await ProjectApi.project(projectId);
                setProjectName(res.data?.data?.name || "Project");
            } catch (error) {
                console.error("Failed to fetch project name", error);
                setProjectName("Project");
            }
        } else {
            setProjectName("");
        }
    };
    fetchProjectName();
  }, [projectId]);

  const getPageTitle = () => {
      const path = location.pathname;
      if (path.includes('/project')) return 'Projects';
      if (path.includes('/task')) return 'Tasks';
      if (path.includes('/user')) return 'Teams';
      if (path.includes('/testing')) return 'Testing';
      return 'Dashboard';
  };

  // Notification Logic
  const handleNavigateToNotification = () => {
    navigate("/notification");
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationApi.markAllAsRead();
      getAllNotification();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const groupNotificationsByDay = (notifications) => {
    if (!notifications) return [];
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

  const handleUpdateNotify = async (data) => {
    const id = data?._id;

    if (
      data?.title === "Task created for you" ||
      data?.title === "Task updated for you"
    ) {
      navigate(`/task/dashboard?projectId=${data?.projectId?._id}`);
    } else if (
      data?.title === "Test created for you" ||
      data?.title === "Test updated for you"
    ) {
      navigate(
        `/testing/my-task?type=Test Case&projectId=${data?.projectId?._id}`
      );
    } else if (
      data?.title === "Bug created for you" ||
      data?.title === "Bug updated for you"
    ) {
      navigate(
        `/testing/my-task?type=Bug Reporting&projectId=${data?.projectId?._id}`
      );
    }
    try {
      await NotificationApi.updateStatus(id);
      setTimeout(() => {
        getAllNotification();
      }, 1000);
      setShowDropdown(false);
    } catch (err) {
      console.log(err);
    }
  };

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
          // handleLoading(true); // Don't block UI for token
          try {
            const res = await UserApi.saveFcmToken(payload);
            console.log("This is the response of the fcm token ", res.data);
          } catch (err) {
            console.log(err);
          } finally {
            // handleLoading(false);
          }
        })();
      } else {
        console.log("No registration token available.");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
  };

  useEffect(() => {
    getAllNotification();
  }, []);

  useEffect(() => {
    if (currentUser?._id) {
        requestPermission(currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const notificationIconClass = isNotification ? "shake" : "";

  return (
    <header className="h-16 bg-surface border-b border-borderLight px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Breadcrumbs / Page Title */}
        <div className="flex items-center gap-4">
             <div className="flex items-center text-sm text-textSub">
                 <span className="hover:text-textMain cursor-pointer">{getPageTitle()}</span>
                 {projectName && (
                     <>
                        <span className="mx-2">/</span>
                        <span className="font-semibold text-textMain flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            {projectName}
                        </span>
                     </>
                 )}
             </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textSub" />
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    className="pl-9 pr-4 py-2 rounded-lg border border-borderLight bg-bgLight text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                 />
            </div>
            
            <button className="w-10 h-10 rounded-full border border-borderLight flex items-center justify-center text-textSub hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all">
                <IoCalendarOutline size={20} />
            </button>
            
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => {
                        setShowDropdown(!showDropdown);
                        if(isNotification) setIsNotification(false);
                    }}
                    className={`w-10 h-10 rounded-full border border-borderLight flex items-center justify-center text-textSub hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all relative ${notificationIconClass}`}
                >
                    <IoNotificationsOutline size={20} />
                    {notificationData?.length > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                    )}
                </button>

                {showDropdown && (
                    <div className="absolute top-12 right-0 w-96 bg-surface border border-borderLight rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-borderLight bg-bgLight/50">
                            <div className="font-semibold text-textMain">Notifications</div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-primary hover:underline font-medium"
                                    disabled={notificationData?.length === 0}
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={handleNavigateToNotification}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    View all
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                            {notificationData?.length > 0 ? (
                                groupNotificationsByDay(notificationData).map((group, groupIndex) => (
                                    <div key={groupIndex}>
                                        <div className="sticky top-0 px-4 py-1.5 bg-bgLight text-xs font-semibold text-textSub uppercase tracking-wider backdrop-blur-sm border-y border-borderLight/50">
                                            {group.dateLabel}
                                        </div>
                                        {group.notifications.map((data, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleUpdateNotify(data)}
                                                className={`p-4 cursor-pointer border-b border-borderLight last:border-0 hover:bg-bgLight/50 transition-colors ${!data.notificationStatus ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="relative flex-shrink-0">
                                                        {data.senderId?.profileImage ? (
                                                            <img
                                                                src={data.senderId.profileImage}
                                                                alt="Avatar"
                                                                className="w-10 h-10 rounded-full object-cover border border-borderLight"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold border border-primary/20">
                                                                {data.senderId?.firstName?.charAt(0) || 'U'}
                                                            </div>
                                                        )}
                                                        {!data.notificationStatus && (
                                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white"></span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-sm font-semibold text-textMain truncate">
                                                                {data.senderId?.firstName} {data.senderId?.lastName}
                                                            </p>
                                                            <span className="text-xs text-textSub ml-2 whitespace-nowrap">
                                                                {moment(data.createdAt).fromNow(true)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-textMain leading-snug">
                                                            {data.title}
                                                            {data.projectId?.name && (
                                                                <span className="text-textSub ml-1 block text-xs mt-0.5">
                                                                    in {data.projectId.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-textSub">
                                    <IoNotificationsOutline size={48} className="mb-3 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primaryHover transition-all shadow-lg shadow-primary/20">
                Share
            </button>
        </div>
    </header>
  );
};


export default Header;
