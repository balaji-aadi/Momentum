import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Notification } from "../../models/notification.model.js";

const nt = {};

//  Update Notification
nt.updateNotification = asyncHandler(async (req, res) => {
  if (!req.params.id || req.params.id === "undefined") {
    return res.status(400).json(new ApiError(400, "ID not provided"));
  }

  const updatedNotification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $set: { notificationStatus: true } },
    { new: true }
  );

  if (!updatedNotification) {
    return res.status(404).json(new ApiError(404, "Notification not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNotification, "Notification updated successfully"));
});


//  Get All Notifications
nt.getAllNotification = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);

  let { filter = {}, sortOrder = -1 } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }

  console.log("Filter before processing:", filter);

  if (typeof filter.notificationStatus === "string") {
    filter.notificationStatus = filter.notificationStatus === "true";
  }

  let query = { receiverId: userId };
  if (filter.notificationStatus !== undefined) {
    query.notificationStatus = filter.notificationStatus;
  }

  const notifications = await Notification.find(query)
    .populate("senderId", "firstName lastName email phoneNumber profileImage userRole")
    .populate("receiverId", "firstName lastName email phoneNumber profileImage userRole")
    .populate("projectId", "name description startDate endDate priority status clientName")
    .sort({ createdAt: sortOrder });

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});


//mark All Notification
nt.markAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }

  const result = await Notification.updateMany(
    { receiverId: userId, notificationStatus: false },
    { $set: { notificationStatus: true } }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      `${result.modifiedCount} notifications marked as read`
    )
  );
});

export default nt;
