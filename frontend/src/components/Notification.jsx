"use client";
import React, { useEffect, useState } from "react";
import { NotificationApi } from "../services/api/notification.api";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../SocketProvider";

const Notification = () => {
  const [activeTab, setActiveTab] = useState("unread");
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getAllNotification } = useSocket();

  const router = useNavigate();

  const handleUpdateNotify = async (data) => {
    const id = data?._id;

    if (data?.title.includes("Task")) {
      router(`/task/dashboard?projectId=${data?.projectId?._id}`);
    } else if (data?.title.includes("Test")) {
      router(`/testing/my-task?type=Test Case&projectId=${data?.projectId?._id}`);
    } else if (data?.title.includes("Bug")) {
      router(`/testing/my-task?type=Bug Reporting&projectId=${data?.projectId?._id}`);
    }

    try {
      await NotificationApi.updateStatus(id);
      setTimeout(() => {
        getAllNotification();
      }, 500);
    } catch (err) {
      console.error("Error updating notification:", err);
    }
  };

  const getAllNotifications = async () => {
    setIsLoading(true);
    try {
      const [unreadRes, readRes] = await Promise.all([
        NotificationApi.getAllNotify({ filter: { notificationStatus: false } }),
        NotificationApi.getAllNotify({ filter: { notificationStatus: true } })
      ]);

      setUnreadNotifications(unreadRes.data?.data || []);
      setReadNotifications(readRes?.data?.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllNotification();
    getAllNotifications();
  }, []);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}` || 'U';
  };

  const NotificationItem = ({ notification, isUnread }) => {
    const formattedDate = moment(notification.createdAt).format("MMM D, h:mm A");
    const timeAgo = moment(notification.createdAt).fromNow();

    return (
      <div
        className={`flex items-start p-4 rounded-lg transition-all duration-200  ${isUnread
          ? "border-l-4 border-blue-500 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
          }`}
        onClick={() => isUnread && handleUpdateNotify(notification)}
      >
        <div className="relative flex-shrink-0 mr-3">
          {notification?.senderId?.profileImage ? (
            <img
              src={notification.senderId.profileImage}
              alt={`${notification.senderId?.firstName} Avatar`}
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-700">
              <span className="font-medium text-gray-700 dark:text-white">
                {getInitials(notification.senderId?.firstName, notification.senderId?.lastName)}
              </span>
            </div>
          )}
          {isUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.senderId?.firstName} {notification.senderId?.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {notification.title}{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  @ {notification.projectId?.name}
                </span>
              </p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
            </div>
          </div>

          {notification.projectId?.priority && (
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${notification.projectId.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              notification.projectId.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
              {notification.projectId.priority}
            </span>
          )}

          {notification.message && (
            <div className="mt-2 p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
              {notification.message}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {formattedDate}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pr-10 p-4 md:p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col dark:bg-gray-900">
      {/* Notification Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h2>
          <button
            onClick={getAllNotifications}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4">
            <button
              className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === "unread"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("unread")}
            >
              Unread
              {unreadNotifications.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            <button
              className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === "read"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              onClick={() => setActiveTab("read")}
            >
              Read
            </button>
          </nav>
        </div>
      </div>

      {/* Notifications Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 space-y-3">
            {activeTab === "unread" ? (
              unreadNotifications.length > 0 ? (
                unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    isUnread={true}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">All caught up!</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You don't have any unread notifications right now.
                  </p>
                </div>
              )
            ) : (
              readNotifications.length > 0 ? (
                readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    isUnread={false}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No read notifications</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your read notifications will appear here.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;