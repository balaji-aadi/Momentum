import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { TestCase } from "../../models/testTask.model.js";
import mongoose from "mongoose";
import { calculateStatusDuration } from "../../utils/calculateStatusDuration.js";
import { Notification } from "../../models/notification.model.js";
import notificationService from "../notification-service/notification.service.js";
import { socketService } from "../../app.js";

const test = {};

// Create Test Case
test.createTestTask = asyncHandler(async (req, res) => {
  try {
    const {
      projectId,
      testCaseName,
      testStatus,
      preconditions,
      testScenarioDescription,
      image,
      testSteps,
      milestone,
      assignee,
    } = req.body;

    if (
      !projectId ||
      !testCaseName ||
      !testScenarioDescription ||
      !testStatus
    ) {
      return res.status(400).json(new ApiError(400, "Missing required fields"));
    }

    const createdTask = await TestCase.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      testCaseName,
      testStatus,
      preconditions,
      testScenarioDescription,
      image,
      testSteps,
      assignee,
      milestone,
      createdBy: req.user?._id,
      activityLogs: [
        {
          oldStatus: null,
          currentStatus: testStatus,
          user: req.user?._id,
          date: new Date(),
          message: `Test case created with status ${testStatus}`,
        },
      ],
    });

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Test created for you",
      message: testCaseName,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    const message = { title: "Test created for you", body: testCaseName };
    socketService._io.emit("notification", message, assignee);
    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdTask, "Test case created successfully")
      );
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(400, "Internal server error"));
  }
});

// Update Test Case
test.updateTestTask = asyncHandler(async (req, res) => {
  try {
    const { testCaseId } = req.params;
    if (!testCaseId) {
      return res
        .status(400)
        .json(new ApiError(400, "Test case ID not provided"));
    }

    const {
      projectId,
      testCaseName,
      testStatus,
      preconditions,
      testScenarioDescription,
      image,
      testSteps,
      milestone,
      assignee,
    } = req.body;

    const existingTask = await TestCase.findById(testCaseId);

    if (!existingTask) {
      return res.status(404).json(new ApiError(404, "Test case not found"));
    }

    let activityLogEntry = null;
    if (testStatus && existingTask.testStatus !== testStatus) {
      activityLogEntry = {
        oldStatus: existingTask.testStatus,
        currentStatus: testStatus,
        user: req.user?._id,
        date: new Date(),
        message: `status changed from ${existingTask.testStatus} >>> ${testStatus}`,
      };
    }

    const updatedTask = await TestCase.findByIdAndUpdate(
      testCaseId,
      {
        projectId: projectId
          ? new mongoose.Types.ObjectId(projectId)
          : existingTask.projectId,
        testCaseName,
        testStatus,
        preconditions,
        testScenarioDescription,
        image,
        milestone,
        testSteps,
        assignee,
        updatedBy: req.user?._id,
        ...(activityLogEntry && {
          $push: {
            activityLogs: { $each: [activityLogEntry], $position: 0 },
          },
        }),
      },
      { new: true }
    );

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Test updated for you",
      message: testCaseName,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    const message = { title: "Test updated for you", body: testCaseName };
    socketService._io.emit("notification", message, assignee);
    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedTask, "Test case updated successfully")
      );
  } catch (error) {
    console.log("Error------", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
});

// Get Test Case by ID
test.getTestTaskById = asyncHandler(async (req, res) => {
  try {
    const { testCaseId } = req.params;
    if (!testCaseId) {
      return res
        .status(400)
        .json(new ApiError(400, "Test case ID not provided"));
    }

    const task = await TestCase.findById(testCaseId).populate(
      "projectId activityLogs.user assignee createdBy updatedBy"
    );
    if (!task) {
      return res.status(404).json(new ApiError(404, "Test case not found"));
    }

    task.activityLogs.sort((a, b) => b.date - a.date);
    const duration = calculateStatusDuration(task.activityLogs);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { ...task.toObject(), duration },
          "Test case fetched successfully"
        )
      );
  } catch (error) {
    console.log("Error------", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
});

// Get All Test Cases
test.getallTestTasks = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);

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

    if (userRole?.name === "tester") {
      filter.$or = [{ assignee: userId }, { createdBy: userId }];
    } else if (userRole?.name === "developer") {
      filter.assignee = userId;
    } else if (userRole?.name === "projectmanager" && filter.assignee) {
      filter.assignee = new mongoose.Types.ObjectId(filter.assignee);
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { testCaseName: { $regex: regex } },
        { testScenarioDescription: { $regex: regex } },
        { testStatus: { $regex: regex } },
      ];
    }

    if (filter.milestone) {
          filter.milestone = new mongoose.Types.ObjectId(filter.milestone);
    }

    console.log("Final Filter:", filter);

    const tasks = await TestCase.find(filter)
      .populate("projectId milestone")
      .populate("assignee")
      .populate("createdBy updatedBy")
      .sort({ _id: sortOrder });

    console.log("Task length:", tasks.length);

    return res
      .status(200)
      .json(new ApiResponse(200, tasks, "Test cases fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res.status(400).json(new ApiError(400, "Internal server error"));
  }
});

// Delete Test Case
test.deleteTestTask = asyncHandler(async (req, res) => {
  try {
    const { testCaseId } = req.params;
    if (!testCaseId) {
      return res
        .status(400)
        .json(new ApiError(400, "Test case ID not provided"));
    }

    const task = await TestCase.findByIdAndDelete(testCaseId);
    if (!task) {
      return res.status(404).json(new ApiError(404, "Test case not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Test case deleted successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
});

// Update Test Case Status
test.updatetesttaskLog = asyncHandler(async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { testStatus } = req.body;

    const task = await TestCase.findById(testCaseId);
    if (!task) {
      return res.status(404).json(new ApiError(404, "Test case not found"));
    }

    task.activityLogs.unshift({
      oldStatus: task.testStatus,
      currentStatus: testStatus,
      user: req.user?._id,
      date: new Date(),
      message: `Status changed from ${task.testStatus} >>> ${testStatus}`,
    });

    task.testStatus = testStatus;
    task.updatedBy = req.user?._id;
    await task.save();

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Test status updated successfully"));
  } catch (error) {
    console.error("Error------", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
});

export default test;
