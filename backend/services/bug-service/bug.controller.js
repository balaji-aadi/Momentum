import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Bug } from "../../models/bug.model.js";
import { Notification } from "../../models/notification.model.js";
import mongoose from "mongoose";
import notificationService from "../notification-service/notification.service.js";
import { socketService } from "../../app.js";

const bg = {};

// Create Bug
bg.createBug = asyncHandler(async (req, res) => {
  try {
    console.log("Req.body", req.body);

    const {
      projectId,
      bugTitle,
      bugDescription,
      stepsToReproduce,
      severity,
      reproducibility,
      assignee,
      bugStatus,
      attachment,
    } = req.body;

    const requiredFields = {
      projectId,
      bugTitle,
      bugDescription,
      bugStatus,
      severity,
      reproducibility,
    };

    const missingFields = Object.keys(requiredFields).filter(
      (field) => !requiredFields[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json(new ApiError(400, "Missing required fields"));
    }

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json(new ApiError(401, "Unauthorized: No user ID"));
    }

    const createdBug = await Bug.create({
      projectId,
      bugTitle,
      bugDescription,
      stepsToReproduce,
      severity,
      reproducibility,
      assignee,
      bugStatus,
      attachment,
      createdBy: req.user._id,
      activityLogs: [
        {
          oldStatus: null,
          currentStatus: bugStatus,
          user: req.user?._id,
          date: new Date(),
          message: `Test case created with status ${bugStatus}`,
        },
      ],
    });

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Bug created for you",
      message: bugTitle,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    const message = { title: "Bug created for you", body: bugTitle };

    socketService._io.emit("notification", message, assignee);

    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    return res
      .status(201)
      .json(new ApiResponse(201, createdBug, "Bug created successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res.status(400).json(new ApiError(400, "Internal Server Error"));
  }
});

// Update Bug
bg.updateBug = asyncHandler(async (req, res) => {
  try {
    console.log("Reqest body--->", req.body);

    if (!req.params.bugId || req.params.bugId === "undefined") {
      return res.status(400).json(new ApiError(400, "Bug ID not provided"));
    }

    const {
      projectId,
      bugTitle,
      bugDescription,
      stepsToReproduce,
      severity,
      reproducibility,
      assignee,
      bugStatus,
      attachment,
    } = req.body;

    const existingBug = await Bug.findById(req.params.bugId);
    if (!existingBug) {
      return res.status(400).json(new ApiError(400, "Bug not found"));
    }

    let activityLogEntry = null;
    if (bugStatus && existingBug.bugStatus !== bugStatus) {
      activityLogEntry = {
        oldStatus: existingBug.bugStatus,
        currentStatus: bugStatus,
        user: req.user?._id,
        date: new Date(),
        message: `status changed from ${existingBug.bugStatus} >>> ${bugStatus}`,
      };
    }

    const updateBug = await Bug.findByIdAndUpdate(
      req.params.bugId,
      {
        projectId,
        bugTitle,
        bugDescription,
        stepsToReproduce,
        severity,
        reproducibility,
        assignee,
        bugStatus,
        attachment,
        updatedBy: req.user._id,
        ...(activityLogEntry && {
          $push: {
            activityLogs: {
              $each: [activityLogEntry],
              $position: 0,
            },
          },
        }),
      },
      { new: true }
    );

    if (!updateBug) {
      return res.status(404).json(new ApiError(404, "Bug not found"));
    }

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Bug updated for you",
      message: bugTitle,
      projectId: new mongoose.Types.ObjectId(projectName),
    });

    const message = { title: "bug updated for you", body: bugTitle };
    socketService._io.emit("notification", message, assignee);

    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    return res
      .status(200)
      .json(new ApiResponse(200, updateBug, "Bug updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(400)
      .json(new ApiError(400, error.message || "Internal Server Error"));
  }
});

// Get Bug by ID
bg.getBugById = asyncHandler(async (req, res) => {
  try {
    if (!req.params.bugId || req.params.bugId === "undefined") {
      return res.status(400).json(new ApiError(400, "Bug ID not provided"));
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.bugId)) {
      return res.status(400).json(new ApiError(400, "Invalid Bug ID"));
    }

    const bug = await Bug.findById(req.params.bugId)
      .populate("projectId", "projectName")
      .populate("assignee", "updatedBy")
      .populate("createdBy");

    if (!bug) {
      return res.status(404).json(new ApiError(404, "Bug not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, bug, "Bug fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(400)
      .json(new ApiError(400, error, "Internal Server Error"));
  }
});

// Get All Bugs
bg.getAllBugs = asyncHandler(async (req, res) => {
  console.log("Req.body", req.body);

  try {
    const { search = "" } = req.query;
    let { filter = {}, sortOrder = -1 } = req.body;
    const userRole = req.user?.userRole;
    const userId = req.user?._id;

    if (req.body.projectId) {
      filter.projectId = req.body.projectId;
    }

    console.log("Filter before processing:", filter);

    if (!filter.projectId) {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    filter.projectId = new mongoose.Types.ObjectId(filter.projectId);

    // Role-based filtering
    let roleFilter = {};
    if (userRole?.name === "tester") {
      roleFilter.$or = [{ assignee: userId }, { createdBy: userId }];
    } else if (userRole?.name === "developer") {
      roleFilter.assignee = userId;
    } else if (userRole?.name === "projectmanager" && filter.assignee) {
      filter.assignee = new mongoose.Types.ObjectId(filter.assignee);
    }

    // Search filtering
    let searchFilter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchFilter.$or = [
        { bugTitle: { $regex: regex } },
        { bugDescription: { $regex: regex } },
        { severity: { $regex: regex } },
        { reproducibility: { $regex: regex } },
        { bugStatus: { $regex: regex } },
      ];
    }

    // Merge filters properly
    const combinedFilter = { ...filter, ...roleFilter };
    if (search) {
      combinedFilter.$or = [...(combinedFilter.$or || []), ...searchFilter.$or];
    }

    console.log("Final Filter:", combinedFilter);

    const bugs = await Bug.find(combinedFilter)
      .populate("projectId", "projectName")
      .populate("assignee")
      .populate("createdBy")
      .populate("updatedBy")
      .sort({ _id: sortOrder });

    console.log("Bug count:", bugs.length);

    return res
      .status(200)
      .json(new ApiResponse(200, bugs, "Bugs fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(400)
      .json(new ApiError(400, error.message || "Internal Server Error"));
  }
});

// Delete Bug
bg.deleteBug = asyncHandler(async (req, res) => {
  try {
    if (!req.params.bugId || req.params.bugId === "undefined") {
      return res.status(400).json(new ApiError(400, "Bug ID not provided"));
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.bugId)) {
      return res.status(400).json(new ApiError(400, "Invalid Bug ID"));
    }

    const bug = await Bug.findByIdAndDelete(req.params.bugId);

    if (!bug) {
      return res.status(404).json(new ApiError(404, "Bug not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, bug, "Bug deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(400)
      .json(new ApiError(400, error, "Internal Server Error"));
  }
});

//update bug status
bg.updateBugLog = asyncHandler(async (req, res) => {
  console.log("req.body", req.body);

  try {
    const { bugId } = req.params;
    const { bugStatus } = req.body;

    if (!bugId) {
      return res
        .status(400)
        .json({ success: false, message: "Bug ID not provided" });
    }

    if (!bugStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Bug status not provided" });
    }

    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ success: false, message: "Bug not found" });
    }

    bug.activityLogs.unshift({
      oldStatus: bug.bugStatus,
      currentStatus: bugStatus,
      user: req.user?._id || "Unknown",
      date: new Date(),
      message: `Status changed from ${bug.bugStatus} >>> ${bugStatus}`,
    });

    bug.bugStatus = bugStatus;
    bug.updatedBy = req.user?._id || "Unknown";

    await bug.save();

    return res
      .status(200)
      .json(new ApiResponse(200, bug, "Bug status updated successfully"));
  } catch (error) {
    console.error("Error updating bug log:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

export default bg;
