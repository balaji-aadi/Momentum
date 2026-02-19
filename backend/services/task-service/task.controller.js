import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Task } from "../../models/task.model.js";
import { Project } from "../../models/project.model.js";
import mongoose from "mongoose";
import { calculateStatusDuration } from "../../utils/calculateStatusDuration.js";
import { Notification } from "../../models/notification.model.js";
import notificationService from "../notification-service/notification.service.js";
import { socketService } from "../../socket-instance.js";
import { ProgressService } from "../progress-service/progress.service.js";

const tc = {};

// create Task
tc.createTask = asyncHandler(async (req, res) => {
  console.log("req.body", req.body)
  try {
    const {
      projectName,
      taskName,
      taskPriority,
      taskType,
      taskStartDate,
      taskDueDate,
      assignee,
      taskDescription,
      estimatedHours,
      storyPoints,
      epic,
      sprint,
      milestone,
      dependentTasks,
      attachments,
      additionalNotes,
      status,
      progress,
    } = req.body;

    const requiredFields = {
      // projectName, // Made optional
      taskName,
      taskPriority,
      taskType,
      // taskStartDate, // Made optional
      // taskDueDate, // Made optional
      // assignee, // Made optional
      // estimatedHours,
    };

    const missingFields = Object.keys(requiredFields).filter(
      (field) => !requiredFields[field] || requiredFields[field] === "undefined"
    );

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            `Missing required field: ${missingFields.join(", ")}`
          )
        );
    }

    // Data Integrity: Check Parent Task Project
    if (req.body.parentTask) {
        const parent = await Task.findById(req.body.parentTask);
        if (!parent) {
             return res.status(400).json(new ApiError(400, "Parent Task not found"));
        }
        // Ensure subtask belongs to same project (handling ObjectId comparison)
        if (projectName && parent.projectName && parent.projectName.toString() !== projectName.toString()) {
            return res.status(400).json(new ApiError(400, "Subtask must belong to the same project as Parent Task"));
        }
    }

    // Generate Readable Task ID (e.g., MOM-101)
    let taskId = null;
    if (projectName) {
      const project = await Project.findById(projectName);
      if (project && project.key) {
        const lastTask = await Task.findOne({ projectName }).sort({ createdAt: -1 });
        let nextNum = 1;
        if (lastTask && lastTask.taskId) {
           const parts = lastTask.taskId.split('-');
           const lastNum = parseInt(parts[parts.length - 1]);
           if (!isNaN(lastNum)) nextNum = lastNum + 1;
        } else {
           // Fallback/Init: Count existing tasks to be safe or start at 1
           const count = await Task.countDocuments({ projectName });
           nextNum = count + 1;
        }
        taskId = `${project.key}-${nextNum}`;
      }
    }

    const createdTask = await Task.create({
      projectName: projectName || undefined,
      taskName,
      taskId,
      taskPriority,
      taskType,
      taskStartDate,
      taskDueDate,
      assignee: assignee || null,
      taskDescription,
      estimatedHours,
      storyPoints,
      epic,
      sprint,
      dependentTasks,
      additionalNotes,
      attachments,
      milestone,
      status,
      progress: progress || 0,
      createdBy: req.user?._id,
      activityLogs: [
        {
          oldStatus: null,
          currentStatus: status,
          user: req.user?._id,
          date: new Date(),
          message: `Task created with status Todo`,
        },
      ],
    });

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Task created for you",
      message: taskName,
      projectId: new mongoose.Types.ObjectId(projectName),
    });

    const message = { title: "Task created for you", body: taskName };

    socketService._io.emit("notification", message, assignee);
    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    if (createdTask.parentTask) await ProgressService.updateParentTaskProgress(createdTask.parentTask);
    if (createdTask.milestone) await ProgressService.updateMilestoneProgress(createdTask.milestone);
    if (createdTask.projectName) await ProgressService.updateProjectProgress(createdTask.projectName);
    if (createdTask.sprint) await ProgressService.updateSprintProgress(createdTask.sprint);

    return res
      .status(201)
      .json(new ApiResponse(201, createdTask, "Task created successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});


//update Task
tc.updateTask = asyncHandler(async (req, res) => {
  console.log("req.body", req.body)
  try {
    if (!req.params.taskId || req.params.taskId === "undefined") {
      return res.status(400).json(new ApiError(400, "Task ID not provided"));
    }

    const {
      projectName,
      taskName,
      taskPriority,
      taskType,
      taskStartDate,
      taskDueDate,
      assignee,
      status,
      milestone,
      attachments,
      taskDescription,
      dependentTasks,
      estimatedHours,
      storyPoints,
      epic,
      sprint,
      additionalNotes,
      progress,
    } = req.body;

    const existingTask = await Task.findById(req.params.taskId);
    if (!existingTask) {
      return res.status(400).json(new ApiError(400, "Task not found"));
    }

    let activityLogEntry = null;
    if (status && existingTask.status !== status) {
      activityLogEntry = {
        oldStatus: existingTask.status,
        currentStatus: status,
        user: req.user?._id,
        date: new Date(),
        message: `Task has been updated from ${existingTask.status} >>> ${status}`,
      };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      {
        projectName,
        taskName,
        taskPriority,
        taskType,
        taskStartDate,
        taskDueDate,
        assignee,
        taskDescription,
        attachments,
        estimatedHours,
        storyPoints,
        epic,
        sprint,
        dependentTasks,
        milestone,
        additionalNotes,
        status,
        progress,
        updatedBy: req.user?._id,
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

    if (!updatedTask) {
      return res.status(400).json(new ApiError(400, "Task not found"));
    }

    await Notification.create({
      senderId: req.user?._id,
      receiverId: new mongoose.Types.ObjectId(assignee),
      title: "Task updated for you",
      message: taskName,
      projectId: new mongoose.Types.ObjectId(projectName),
    });

    const message = { title: "Task updated for you", body: taskName };
    socketService._io.emit("notification", message, assignee);
    await notificationService(new mongoose.Types.ObjectId(assignee), message);

    // Cascading Progress Updates
    if (updatedTask.parentTask) await ProgressService.updateParentTaskProgress(updatedTask.parentTask);
    if (updatedTask.milestone) await ProgressService.updateMilestoneProgress(updatedTask.milestone);
    if (updatedTask.projectName) await ProgressService.updateProjectProgress(updatedTask.projectName);
    if (updatedTask.sprint) await ProgressService.updateSprintProgress(updatedTask.sprint);

    // If parent changed, we should technically update the OLD parent too, but let's keep it simple for now or strictly follow requirements.
    // Ideally: if (existingTask.parentTask && existingTask.parentTask !== updatedTask.parentTask) ...

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, "Internal server error"));
  }
});


// get task by id
tc.getTaskById = asyncHandler(async (req, res) => {
  try {
    if (req.params.taskId == "undefined" || !req.params.taskId) {
      return res.status(400).json(new ApiError(400, "id not provided"));
    }
    const task = await Task.findById(req.params.taskId).populate(
      "projectName assignee activityLogs.user"
    );

    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }
    task.activityLogs.sort((a, b) => b.date - a.date);
    const duration = calculateStatusDuration(task.activityLogs);

    const taskWithDuration = {
      ...task.toObject(),
      duration,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, taskWithDuration, "Task fetched successfully")
      );
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});


// get all tasks
tc.getallTasks = asyncHandler(async (req, res) => {
  console.log("req.body--->", req.body);

  try {
    const { search = "" } = req.query;
    let { filter = {}, sortOrder = -1 } = req.body;
    const userRole = req.user?.userRole;

    let searchCondition = {};
    if (search && search !== "undefined") {
      const regex = new RegExp(search, "i");
      searchCondition.$or = [
        { taskName: { $regex: regex } },
        { taskPriority: { $regex: regex } },
        { taskType: { $regex: regex } },
        { taskDescription: { $regex: regex } },
        { additionalNotes: { $regex: regex } },
        { status: { $regex: regex } },
      ];
    }

    if (filter?.projectName) {
      filter.projectName = new mongoose.Types.ObjectId(filter.projectName);
    }

    if (filter.milestone) {
      filter.milestone = new mongoose.Types.ObjectId(filter.milestone);
    }
    
    if (filter.sprint) {
      filter.sprint = new mongoose.Types.ObjectId(filter.sprint);
    }

    if (filter.epic) {
      filter.epic = new mongoose.Types.ObjectId(filter.epic);
    }

    if (userRole?.name === "developer") {
      filter.assignee = req.user?._id;
    }

    if (filter?.assignee && userRole?.name === "projectmanager") {
      filter.assignee = new mongoose.Types.ObjectId(filter.assignee);
    }

    if (filter?.type === "open") {
      searchCondition.status = { $in: ["todo", "inprogress"] };
    } else if (filter?.type === "hold") {
      searchCondition.status = "hold";
    }

    delete filter.type;

    const tasks = await Task.find({ ...searchCondition, ...filter })
    .populate("projectName assignee milestone epic sprint activityLogs.user parentTask")
    .populate({
      path: "dependentTasks",
      populate: [
      {
        path: "createdBy",
        select: "email userRole firstName lastName"
      },
      {
        path: "assignee",
        select: "email userRole firstName lastName"
      }
    ]
    })
    .populate({
      path: "createdBy",
      select: "email userRole firstName lastName"
    })
    .sort({ _id: sortOrder });
  

    if (tasks.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No tasks found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res
      .status(400)
      .json(new ApiError(400, error.message || "Error fetching tasks"));
  }
});


// delete task
tc.deleteTask = asyncHandler(async (req, res) => {
  try {
    if (req.params.taskId == "undefined" || !req.params.taskId) {
      return res.status(400).json(new ApiError(400, "id not provided"));
    }

    const task = await Task.findByIdAndDelete(req.params.taskId);

    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task deleted successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});


//update Task status
tc.updatetaskLog = asyncHandler(async (req, res) => {
  console.log("Req.body", req.body);

  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!taskId) {
      return res.status(400).json(new ApiError(400, "Task ID not provided"));
    }

    if (!status) {
      return res.status(400).json(new ApiError(400, "Status not provided"));
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    task.activityLogs.push({
      oldStatus: task.status,
      currentStatus: status,
      user: req.user?._id, // Ensure this is stored as an ObjectId
      date: new Date(),
      message: `Status had been changed from ${task.status} >>> ${status}`,
    });

    task.status = status;
    task.updatedBy = req.user?._id;
    await task.save();

    // Cascading Progress Updates
    await ProgressService.updateParentTaskProgress(task.parentTask);
    if (task.milestone) await ProgressService.updateMilestoneProgress(task.milestone);
    if (task.projectName) await ProgressService.updateProjectProgress(task.projectName);
    if (task.sprint) await ProgressService.updateSprintProgress(task.sprint);

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task status updated successfully"));
  } catch (error) {
    console.error("Error------", error);
    return res.status(400).json(new ApiError(404, "Internal server error"));
  }
});


//deletemilestone
tc.deletemilestone = asyncHandler(async (req, res) => {
  try {
    const { milestoneId } = req.params;
    console.log("milestoneId:", milestoneId);

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        message: "milestone ID not provided",
      });
    }

    const linkedTasks = await Task.find({ "milestone._id": milestoneId });

    if (linkedTasks.length > 0) {
      return res
        .status(203)
        .json(new ApiResponse(203, "This milestone can't be deleted — tasks are linked."));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "This milestone can be safely deleted."));

  } catch (error) {
    console.error("Error checking milestone deletability:", error);
    return res
      .status(500)
      .json(new ApiError(500, error, "Internal Server Error"));
  }
});


//getalltaskregardless
tc.getallTasksfree = asyncHandler(async (req, res) => {
  console.log("req.body--->", req.body);

  try {
    const { search = "" } = req.query;
    let { sortOrder = -1 } = req.body;

    let searchCondition = {};
    if (search && search !== "undefined") {
      const regex = new RegExp(search, "i");
      searchCondition.$or = [
        { taskName: { $regex: regex } },
        { taskPriority: { $regex: regex } },
        { taskType: { $regex: regex } },
        { taskDescription: { $regex: regex } },
        { additionalNotes: { $regex: regex } },
        { status: { $regex: regex } },
      ];
    }

    const tasks = await Task.find(searchCondition)
    .populate("projectName assignee milestone activityLogs.user")
    .populate({
      path: "dependentTasks",
      populate: [
      {
        path: "createdBy",
        select: "email userRole firstName lastName"
      },
      {
        path: "assignee",
        select: "email userRole firstName lastName"
      }
    ]
    })
    .populate({
      path: "createdBy",
      select: "email userRole firstName lastName"
    })
    .sort({ _id: sortOrder });;

    if (tasks.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No tasks found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res
      .status(400)
      .json(new ApiError(400, error.message || "Error fetching tasks"));
  }
});

export default tc;