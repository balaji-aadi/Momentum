import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Task } from "../../models/task.model.js";
import { Project } from "../../models/project.model.js";
import { Sprint } from "../../models/sprint.model.js";
import { DailyRevision } from "../../models/dailyRevision.model.js";
import { FocusSession } from "../../models/focusSession.model.js";
import mongoose from "mongoose";
import { calculateStatusDuration } from "../../utils/calculateStatusDuration.js";
import { Notification } from "../../models/notification.model.js";
import notificationService from "../notification-service/notification.service.js";
import { socketService } from "../../socket-instance.js";
import { ProgressService } from "../progress-service/progress.service.js";
import AnalyticsService from "../analytics-service/analytics.service.js";
import axios from "axios";

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
      youtubeUrl,
      status,
      progress,
      parentTask,
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
    if (parentTask) {
        const parent = await Task.findById(parentTask);
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

    // Date Validation for Subtasks
    if (parentTask) {
        const parent = await Task.findById(parentTask);
        if (parent) {
            const start = new Date(taskStartDate);
            const due = new Date(taskDueDate);
            const pStart = parent.taskStartDate ? new Date(parent.taskStartDate) : null;
            const pDue = parent.taskDueDate ? new Date(parent.taskDueDate) : null;

            if (pStart && start < pStart) {
                return res.status(400).json(new ApiError(400, `Subtask start date (${start.toLocaleDateString()}) cannot be before parent task start date (${pStart.toLocaleDateString()})`));
            }
            if (pDue && due > pDue) {
                return res.status(400).json(new ApiError(400, `Subtask due date (${due.toLocaleDateString()}) cannot be after parent task due date (${pDue.toLocaleDateString()})`));
            }
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
      youtubeUrl,
      attachments,
      milestone: milestone || null,
      status,
      progress: progress || 0,
      createdBy: req.user?._id,
      parentTask: parentTask || null,
      branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : undefined,
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

    // Update Analytics
    AnalyticsService.handleTaskUpdate(createdTask.assignee, createdTask.projectName, createdTask._id, null, createdTask.status).catch(err => console.error("Analytics Error:", err));

    return res
      .status(201)
      .json(new ApiResponse(201, createdTask, "Task created successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});

// get last created Task
tc.getLastCreatedTask = asyncHandler(async (req, res) => {
  try {
    const lastTask = await Task.findOne({ createdBy: req.user?._id })
      .sort({ createdAt: -1 })
      .populate("projectName milestone sprint parentTask assignee");

    if (!lastTask) {
      return res.status(200).json(new ApiResponse(200, null, "No previous tasks found"));
    }

    return res.status(200).json(new ApiResponse(200, lastTask, "Last created task fetched successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(400, "Error fetching last created task"));
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
      backlogEstimatedHours,
      storyPoints,
      epic,
      sprint,
      additionalNotes,
      youtubeUrl,
      progress,
      parentTask,
    } = req.body;

    const existingTask = await Task.findById(req.params.taskId);
    if (!existingTask) {
      return res.status(400).json(new ApiError(400, "Task not found"));
    }

    // Status Restriction: Any task cannot be 'done' if it has pending subtasks
    if (status === 'done') {
        const pendingSubtasks = await Task.countDocuments({
            parentTask: new mongoose.Types.ObjectId(existingTask._id),
            status: { $ne: 'done' }
        });
        if (pendingSubtasks > 0) {
            return res.status(400).json(new ApiError(400, "Cannot complete task while subtasks are still pending."));
        }
    }

    // Date Validation for Subtasks
    if (existingTask.parentTask) {
        const parent = await Task.findById(existingTask.parentTask);
        if (parent) {
            const start = taskStartDate ? new Date(taskStartDate) : existingTask.taskStartDate ? new Date(existingTask.taskStartDate) : null;
            const due = taskDueDate ? new Date(taskDueDate) : existingTask.taskDueDate ? new Date(existingTask.taskDueDate) : null;
            
            const pStart = parent.taskStartDate ? new Date(parent.taskStartDate) : null;
            const pDue = parent.taskDueDate ? new Date(parent.taskDueDate) : null;

            if (pStart && start && start < pStart) {
                return res.status(400).json(new ApiError(400, `Subtask start date cannot be before parent task start date (${pStart.toLocaleDateString()})`));
            }
            if (pDue && due && due > pDue) {
                return res.status(400).json(new ApiError(400, `Subtask due date cannot be after parent task due date (${pDue.toLocaleDateString()})`));
            }
        }
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

    // Construct update object with only defined fields (Partial Update)
    const updateFields = {};
    if (projectName !== undefined) updateFields.projectName = projectName;
    if (taskName !== undefined) updateFields.taskName = taskName;
    if (taskPriority !== undefined) updateFields.taskPriority = taskPriority;
    if (taskType !== undefined) updateFields.taskType = taskType;
    if (taskStartDate !== undefined) updateFields.taskStartDate = taskStartDate;
    if (taskDueDate !== undefined) updateFields.taskDueDate = taskDueDate;
    if (assignee !== undefined) updateFields.assignee = assignee;
    if (taskDescription !== undefined) updateFields.taskDescription = taskDescription;
    if (attachments !== undefined) updateFields.attachments = attachments;
    if (estimatedHours !== undefined) updateFields.estimatedHours = estimatedHours;
    if (backlogEstimatedHours !== undefined) updateFields.backlogEstimatedHours = backlogEstimatedHours;
    if (storyPoints !== undefined) updateFields.storyPoints = storyPoints;
    if (epic !== undefined) updateFields.epic = epic;
    if (sprint !== undefined) updateFields.sprint = sprint;
    if (dependentTasks !== undefined) updateFields.dependentTasks = dependentTasks;
    if (milestone !== undefined) updateFields.milestone = milestone || null;
    if (parentTask !== undefined) updateFields.parentTask = parentTask ? new mongoose.Types.ObjectId(parentTask) : null;
    if (additionalNotes !== undefined) updateFields.additionalNotes = additionalNotes;
    if (youtubeUrl !== undefined) updateFields.youtubeUrl = youtubeUrl;
    if (status !== undefined) {
      updateFields.status = status;
      if (status === 'hold') {
        if (!existingTask.parentTask) {
          updateFields.holdDate = new Date();
        }
      } else if (existingTask.status === 'hold') {
        if (!existingTask.parentTask) {
          updateFields.holdDate = null;
        }
      }
    }
    if (progress !== undefined) updateFields.progress = progress;
    if (status === 'done') updateFields.progress = 100;
    else if (status === 'todo' && progress === undefined) updateFields.progress = 0;
    
    updateFields.updatedBy = req.user?._id;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.taskId, branchId: req.branchId },
      {
        ...updateFields,
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

    // Cascade hold status to child tasks if status changed
    if (status && existingTask.status !== status) {
        await handleHoldCascade(updatedTask, status, existingTask.status, req.user?._id);
    }

    // Only send notification if assignee and projectName are known (either updated or existing)
    const recipientId = assignee || updatedTask.assignee;
    const projId = projectName || updatedTask.projectName;

    if (recipientId && projId) {
        try {
            await Notification.create({
                senderId: req.user?._id,
                receiverId: new mongoose.Types.ObjectId(recipientId),
                title: "Task updated for you",
                message: taskName || updatedTask.taskName,
                projectId: new mongoose.Types.ObjectId(projId),
            });

            const message = { title: "Task updated for you", body: taskName || updatedTask.taskName };
            socketService._io.emit("notification", message, recipientId);
            await notificationService(new mongoose.Types.ObjectId(recipientId), message);
        } catch (notifErr) {
            console.error("Non-blocking notification error:", notifErr);
        }
    }

    // Cascading Progress Updates
    if (updatedTask.parentTask) await ProgressService.updateParentTaskProgress(updatedTask.parentTask);
    
    // If parent changed, update the OLD parent's progress as well
    if (existingTask.parentTask && existingTask.parentTask.toString() !== (updatedTask.parentTask?.toString() || "")) {
        await ProgressService.updateParentTaskProgress(existingTask.parentTask);
    }

    if (updatedTask.milestone) await ProgressService.updateMilestoneProgress(updatedTask.milestone);
    if (updatedTask.projectName) await ProgressService.updateProjectProgress(updatedTask.projectName);
    if (updatedTask.sprint) await ProgressService.updateSprintProgress(updatedTask.sprint);

    // Update Analytics
    if (status && existingTask.status !== status) {
        AnalyticsService.handleTaskUpdate(updatedTask.assignee, updatedTask.projectName, updatedTask._id, existingTask.status, status).catch(err => console.error("Analytics Error:", err));
    }

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
    const task = await Task.findOne({ _id: req.params.taskId, branchId: req.branchId }).populate(
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


import { checkAndTransitionTasks } from "./taskTransition.job.js";

// get all tasks
tc.getallTasks = asyncHandler(async (req, res) => {
  console.log("req.body--->", req.body);
  
  try {
    const { search = "" } = req.query;
    let { filter = {}, sortOrder = -1 } = req.body;
    
    // Enforce branch isolation
    if (req.branchId) {
      filter.branchId = new mongoose.Types.ObjectId(req.branchId);
    }
    // Extract permissions from req.user (already populated in auth middleware)
    const permissions = new Set();
    
    if (req.user?.userRole?.active && req.user?.userRole?.permissions) {
        req.user.userRole.permissions.forEach(p => {
             if (p && p.name) permissions.add(p.name);
        });
    }

    req.user?.userRoles?.forEach(role => {
        if (role.active && role.permissions) {
            role.permissions.forEach(p => {
                if (p && p.name) permissions.add(p.name);
            });
        }
    });

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

    if (filter.parentTask) {
      filter.parentTask = new mongoose.Types.ObjectId(filter.parentTask);
    }

    // ENFORCE INDIVIDUAL ISOLATION: User only sees what they created
    if (req.user?.email !== "balajiaadi2000@gmail.com") {
        filter.createdBy = req.user._id;
    }

    if (filter?.type === "open") {
      searchCondition.status = { $in: ["todo", "inprogress"] };
    } else if (filter?.type === "hold") {
      searchCondition.status = "hold";
    }

    delete filter.type;

    const tasks = await Task.find({ ...searchCondition, ...filter })
    .populate("projectName", "name key settings")
    .populate("assignee", "firstName lastName email")
    .populate("milestone", "milestoneName")
    .populate("epic", "epicName")
    .populate("sprint", "sprintName startDate endDate")
    .populate("parentTask", "taskName taskId status taskStartDate taskDueDate holdDate")
    .populate({
      path: "createdBy",
      select: "firstName lastName email"
    })
    .sort({ _id: sortOrder })
    .lean();
  
    // Auto-sync subtasks of held parent tasks
    const syncedTasks = await autoSyncHeldParentChildren(tasks, req.user?._id);

    // Map tasks to include pre-calculated duration
    syncedTasks.forEach(task => {
        task.duration = calculateStatusDuration(task.activityLogs || []);
    });
  

    if (syncedTasks.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No tasks found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, syncedTasks, "Tasks fetched successfully"));
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

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, branchId: req.branchId });

    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    // Update Analytics
    AnalyticsService.handleTaskDeletion(task).catch(err => console.error("Analytics Deletion Error:", err));

    // Update Cascading Progress
    if (task.parentTask) await ProgressService.updateParentTaskProgress(task.parentTask);
    if (task.milestone) await ProgressService.updateMilestoneProgress(task.milestone);
    if (task.projectName) await ProgressService.updateProjectProgress(task.projectName);
    if (task.sprint) await ProgressService.updateSprintProgress(task.sprint);

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task deleted successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});


const handleHoldCascade = async (parentTask, newStatus, oldStatus, userId) => {
    // If it's a parent task
    if (!parentTask.parentTask) {
        if (newStatus === 'hold') {
            // Find all child tasks (supporting both ObjectId and string representations in DB)
            const childTasks = await Task.find({
                $or: [
                    { parentTask: parentTask._id },
                    { parentTask: parentTask._id.toString() }
                ]
            });
            for (const child of childTasks) {
                // Only put non-done, non-hold child tasks on hold
                if (child.status !== 'hold' && child.status !== 'done') {
                    child.activityLogs.unshift({
                        oldStatus: child.status,
                        currentStatus: 'hold',
                        user: userId,
                        date: new Date(),
                        message: `Status had been changed from ${child.status} >>> hold (inherited from parent task hold)`,
                    });
                    child.status = 'hold';
                    child.updatedBy = userId;
                    await child.save();
                    AnalyticsService.handleTaskUpdate(child.assignee, child.projectName, child._id, child.status, 'hold').catch(err => console.error("Analytics Error:", err));
                }
            }
        } else if (oldStatus === 'hold' && newStatus !== 'hold') {
            // Release all held child tasks to 'todo'
            const childTasks = await Task.find({
                $or: [
                    { parentTask: parentTask._id },
                    { parentTask: parentTask._id.toString() }
                ]
            });
            for (const child of childTasks) {
                if (child.status === 'hold') {
                    child.activityLogs.unshift({
                        oldStatus: 'hold',
                        currentStatus: 'todo',
                        user: userId,
                        date: new Date(),
                        message: `Status had been changed from hold >>> todo (released from parent task hold)`,
                    });
                    child.status = 'todo';
                    child.updatedBy = userId;
                    await child.save();
                    AnalyticsService.handleTaskUpdate(child.assignee, child.projectName, child._id, 'hold', 'todo').catch(err => console.error("Analytics Error:", err));
                }
            }
        }
    }
};

const getParentTaskId = (parentTaskField) => {
    if (!parentTaskField) return null;
    if (typeof parentTaskField === 'string') return parentTaskField;
    if (mongoose.Types.ObjectId.isValid(parentTaskField)) return parentTaskField.toString();
    if (typeof parentTaskField === 'object') {
        if (parentTaskField._id) return parentTaskField._id.toString();
        return parentTaskField.toString();
    }
    return null;
};

const autoSyncHeldParentChildren = async (tasks, userId) => {
    // 1. Find all parent tasks in the fetched list that are on 'hold'
    const heldParentIds = tasks
        .filter(t => !t.parentTask && t.status === 'hold')
        .map(t => t._id.toString());
        
    if (heldParentIds.length === 0) return tasks;

    const updatePromises = [];
    // 2. Loop through all fetched tasks and sync child tasks in parallel
    for (let task of tasks) {
        const pIdStr = getParentTaskId(task.parentTask);
        if (pIdStr && heldParentIds.includes(pIdStr)) {
            // This child belongs to a held parent task.
            // If it is not 'done' and not 'hold', update it to 'hold'!
            if (task.status !== 'hold' && task.status !== 'done') {
                updatePromises.push(
                    Task.updateOne(
                        { _id: task._id },
                        {
                            $set: { status: 'hold', updatedBy: userId },
                            $push: {
                                activityLogs: {
                                    $each: [{
                                        oldStatus: task.status,
                                        currentStatus: 'hold',
                                        user: userId,
                                        date: new Date(),
                                        message: `Status automatically synced to hold because parent task is on hold`,
                                    }],
                                    $position: 0
                                }
                            }
                        }
                    )
                );
                
                // Update in returned list object
                task.status = 'hold';
                if (!task.activityLogs) task.activityLogs = [];
                task.activityLogs.unshift({
                    oldStatus: task.status,
                    currentStatus: 'hold',
                    user: userId,
                    date: new Date(),
                    message: `Status automatically synced to hold because parent task is on hold`,
                });
                
                // Trigger analytics update asynchronously
                AnalyticsService.handleTaskUpdate(task.assignee, task.projectName, task._id, task.status, 'hold').catch(err => console.error("Analytics Error:", err));
            }
        }
    }
    
    if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
    }
    
    return tasks;
};

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

    const task = await Task.findById(taskId).populate('sprint');
    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    // Restriction for Employees: Cannot change status if sprint hasn't started
    if (task.sprint && new Date() < new Date(task.sprint.startDate)) {
        // Check if user is an employee (doesn't have UPDATE_TASK or CREATE_SPRINT)
        const permissions = new Set();
        if (req.user?.userRole?.active && req.user?.userRole?.permissions) {
            req.user.userRole.permissions.forEach(p => p && p.name && permissions.add(p.name));
        }
        req.user?.userRoles?.forEach(role => {
            if (role.active && role.permissions) role.permissions.forEach(p => p && p.name && permissions.add(p.name));
        });

        const canBypass = permissions.has('UPDATE_TASK') || permissions.has('CREATE_SPRINT');
        if (!canBypass) {
            return res.status(400).json(new ApiError(400, "Cannot update status. The linked sprint has not started yet."));
        }
    }

    // Status Restriction: Any task cannot be 'done' if it has pending subtasks
    if (status === 'done') {
        const pendingSubtasks = await Task.countDocuments({
            parentTask: new mongoose.Types.ObjectId(task._id),
            status: { $ne: 'done' }
        });
        if (pendingSubtasks > 0) {
            return res.status(400).json(new ApiError(400, "Cannot complete task while subtasks are still pending."));
        }
    }

    const oldStatus = task.status; // Store old status before updating

    if (status === 'hold') {
        if (!task.parentTask) {
            task.holdDate = new Date();
        }
    } else if (oldStatus === 'hold') {
        if (!task.parentTask) {
            task.holdDate = null;
        }
    }

    task.activityLogs.unshift({
      oldStatus: task.status,
      currentStatus: status,
      user: req.user?._id, // Ensure this is stored as an ObjectId
      date: new Date(),
      message: `Status had been changed from ${task.status} >>> ${status}`,
    });

    task.status = status;
    if (status === 'done') task.progress = 100;
    else if (status === 'todo') task.progress = 0;

    task.updatedBy = req.user?._id;
    await task.save();

    // Cascading Hold Status to children if parent is put on hold / released
    await handleHoldCascade(task, status, oldStatus, req.user?._id);

    // Cascading Progress Updates
    await ProgressService.updateParentTaskProgress(task.parentTask);
    if (task.milestone) await ProgressService.updateMilestoneProgress(task.milestone);
    if (task.projectName) await ProgressService.updateProjectProgress(task.projectName);
    if (task.sprint) await ProgressService.updateSprintProgress(task.sprint);

    // Update Analytics
    if (status && oldStatus !== status) {
        AnalyticsService.handleTaskUpdate(task.assignee, task.projectName, task._id, oldStatus, status).catch(err => console.error("Analytics Error:", err));
    }

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
    let { filter = {}, sortOrder = -1 } = req.body;
    
    // Enforce branch isolation
    if (req.branchId) {
      filter.branchId = new mongoose.Types.ObjectId(req.branchId);
    }

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
    
    if (req.user?.email !== "balajiaadi2000@gmail.com") {
        filter.createdBy = req.user._id;
    }

    const tasks = await Task.find({ ...searchCondition, ...filter })
    .populate("projectName", "name key settings")
    .populate("assignee milestone activityLogs.user")
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

    // Auto-sync subtasks of held parent tasks
    const syncedTasks = await autoSyncHeldParentChildren(tasks, req.user?._id);

    if (syncedTasks.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No tasks found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, syncedTasks, "Tasks fetched successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res
      .status(400)
      .json(new ApiError(400, error.message || "Error fetching tasks"));
  }
});

// Add Revision
tc.addRevision = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { notes, revisionDate, timezoneOffset } = req.body;

    if (!taskId) {
        return res.status(400).json(new ApiError(400, "Task ID is required"));
    }

    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json(new ApiError(404, "Task not found"));
    }

    const revisionLog = {
        revisionDate: revisionDate || new Date(),
        notes: notes || "",
        revisedBy: req.user?._id
    };

    if (!task.revisionLogs) task.revisionLogs = [];
    task.revisionLogs.push(revisionLog);
    
    await task.save();

    // Check if this task is part of today's DailyRevision and mark it completed
    try {
        const offset = timezoneOffset !== undefined ? parseInt(timezoneOffset) : new Date().getTimezoneOffset();
        const localDateStr = getLocalDateString(new Date(), offset);
        const dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isStarted: true,
            isCompleted: false
        });

        if (dailyRev && dailyRev.questions.some(qId => qId.toString() === task._id.toString())) {
            const completedStrList = dailyRev.completedQuestions.map(q => q.toString());
            if (!completedStrList.includes(task._id.toString())) {
                // 1. Enforce sequence: must be the active question
                const activeIdx = dailyRev.completedQuestions.length;
                const activeTaskId = dailyRev.questions[activeIdx];
                if (!activeTaskId || activeTaskId.toString() !== task._id.toString()) {
                    return res.status(400).json(new ApiError(400, "You must complete the daily revision questions in the exact order shown!"));
                }

                // 2. Sync remaining time to get accurate current timeLeft
                if (dailyRev.timerIsActive && dailyRev.timerLastUpdated) {
                    const now = Date.now();
                    const lastUpdate = new Date(dailyRev.timerLastUpdated).getTime();
                    const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
                    if (elapsedSeconds > 0) {
                        dailyRev.timeLeft = Math.max(0, dailyRev.timeLeft - elapsedSeconds);
                        dailyRev.timerLastUpdated = new Date(now);
                    }
                }

                // 3. Enforce 15-minute rule (900 seconds)
                const timeSpent = dailyRev.currentQuestionStartTimeLeft - dailyRev.timeLeft;
                if (timeSpent < 900) {
                    const remainingSeconds = 900 - timeSpent;
                    const remMins = Math.floor(remainingSeconds / 60);
                    const remSecs = remainingSeconds % 60;
                    return res.status(400).json(new ApiError(400, `You must revise this question for at least 15 minutes! Please wait another ${remMins}m ${remSecs}s.`));
                }

                // 4. Log progress and completion
                dailyRev.completedQuestions.push(task._id);
                
                if (!dailyRev.questionLogs) dailyRev.questionLogs = [];
                dailyRev.questionLogs.push({
                    taskId: task._id,
                    completedAtTimeLeft: dailyRev.timeLeft,
                    timeSpent: timeSpent,
                    notes: notes || ""
                });

                dailyRev.currentQuestionStartTimeLeft = dailyRev.timeLeft;
                
                // Create a persistent FocusSession for the completed revision
                const sessionDurationMins = Math.max(1, Math.round(timeSpent / 60));
                const focusSession = new FocusSession({
                    user: req.user._id,
                    startTime: new Date(Date.now() - timeSpent * 1000),
                    endTime: new Date(),
                    duration: sessionDurationMins,
                    type: "Revision",
                    date: new Date(),
                    task: task._id,
                    taskName: task.taskName,
                    taskIdString: task.taskId,
                    statusAtCompletion: "done",
                    completionState: "completed",
                    branchId: dailyRev.branchId || task.branchId || null
                });
                await focusSession.save();

                // Record analytics
                await AnalyticsService.recordFocusTime(
                    req.user._id, 
                    sessionDurationMins, 
                    focusSession.date, 
                    dailyRev.branchId || task.branchId || null, 
                    task._id
                );

                // Check if all questions are completed now
                if (dailyRev.completedQuestions.length === dailyRev.questions.length) {
                    dailyRev.isCompleted = true;
                    dailyRev.timerIsActive = false;
                    dailyRev.timerLastUpdated = null;
                }
                
                await dailyRev.save();
            }
        }
    } catch (err) {
        console.error("Error updating DailyRevision on addRevision:", err);
        if (err.statusCode || err.message?.includes("must revise") || err.message?.includes("order")) {
            return res.status(err.statusCode || 400).json(new ApiError(err.statusCode || 400, err.message));
        }
    }

    return res.status(200).json(new ApiResponse(200, task, "Revision logged successfully"));
});

const getLocalDateString = (date, offsetMinutes = 0) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  // Subtract timezone offset to get local time, then subtract 4 hours (240 minutes) to push day boundary to 4:00 AM
  const adjusted = new Date(d.getTime() - (offsetMinutes * 60 * 1000) - (4 * 60 * 60 * 1000));
  return adjusted.toISOString().split('T')[0];
};

// Get Revision Stats
tc.getRevisionStats = asyncHandler(async (req, res) => {
    try {
        const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : 0;
        
        const filter = {};
        if (req.branchId) {
            filter.branchId = new mongoose.Types.ObjectId(req.branchId);
        }
        if (req.user?.email !== "balajiaadi2000@gmail.com") {
            filter.createdBy = req.user._id;
        }
        
        // Fetch completed subtasks
        filter.parentTask = { $ne: null };
        filter.status = "done";
        
        const tasks = await Task.find(filter)
            .populate("projectName", "name key settings")
            .populate("parentTask", "taskName taskId")
            .lean();
        
        const revisionLogsByDate = {};
        const completionDates = new Set();
        const revisionDates = new Set();
        
        tasks.forEach(task => {
            let completionDate = null;
            if (task.activityLogs && Array.isArray(task.activityLogs)) {
                const doneLog = [...task.activityLogs]
                    .reverse()
                    .find(log => log.currentStatus === 'done');
                if (doneLog) {
                    completionDate = doneLog.date;
                }
            }
            if (!completionDate) {
                completionDate = task.updatedAt || task.createdAt;
            }
            
            const compDateStr = getLocalDateString(completionDate, timezoneOffset);
            if (compDateStr) {
                completionDates.add(compDateStr);
            }
            
            if (task.revisionLogs && Array.isArray(task.revisionLogs)) {
                task.revisionLogs.forEach(log => {
                    const revDateStr = getLocalDateString(log.revisionDate, timezoneOffset);
                    if (revDateStr) {
                        revisionDates.add(revDateStr);
                        if (!revisionLogsByDate[revDateStr]) {
                            revisionLogsByDate[revDateStr] = [];
                        }
                        revisionLogsByDate[revDateStr].push({
                            taskId: task._id,
                            taskName: task.taskName,
                            taskKey: task.taskId,
                            projectName: task.projectName?.name || task.projectName,
                            projectKey: task.projectName?.key || 'MOM',
                            notes: log.notes,
                            revisionDate: log.revisionDate,
                            revisedBy: log.revisedBy
                        });
                    }
                });
            }
        });
        
        const streakDates = Array.from(revisionDates);
        
        const calculateStreak = (dates) => {
            if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
            
            const sorted = dates.sort((a, b) => new Date(b) - new Date(a));
            const todayStr = getLocalDateString(new Date(), timezoneOffset);
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday, timezoneOffset);
            
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            
            const sortedAsc = [...dates].sort((a, b) => new Date(a) - new Date(b));
            if (sortedAsc.length > 0) {
                tempStreak = 1;
                longestStreak = 1;
                for (let i = 1; i < sortedAsc.length; i++) {
                    const prev = new Date(sortedAsc[i - 1]);
                    const curr = new Date(sortedAsc[i]);
                    const diffTime = Math.abs(curr - prev);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        tempStreak++;
                    } else if (diffDays > 1) {
                        tempStreak = 1;
                    }
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                }
            }
            
            let startOffset = 0;
            if (sorted.includes(todayStr)) {
                currentStreak = 1;
            } else if (sorted.includes(yesterdayStr)) {
                currentStreak = 1;
                startOffset = 1;
            } else {
                currentStreak = 0;
            }
            
            if (currentStreak > 0) {
                let checkDate = new Date();
                if (startOffset === 1) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }
                while (true) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const checkDateStr = getLocalDateString(checkDate, timezoneOffset);
                    if (sorted.includes(checkDateStr)) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
            
            return { currentStreak, longestStreak };
        };
        
        const { currentStreak, longestStreak } = calculateStreak(streakDates);
        
        const completedByDate = {};
        tasks.forEach(task => {
            let completionDate = null;
            if (task.activityLogs && Array.isArray(task.activityLogs)) {
                const doneLog = [...task.activityLogs]
                    .reverse()
                    .find(log => log.currentStatus === 'done');
                if (doneLog) {
                    completionDate = doneLog.date;
                }
            }
            if (!completionDate) {
                completionDate = task.updatedAt || task.createdAt;
            }
            const dateStr = getLocalDateString(completionDate, timezoneOffset);
            if (dateStr) {
                if (!completedByDate[dateStr]) {
                    completedByDate[dateStr] = [];
                }
                completedByDate[dateStr].push({
                    taskId: task._id,
                    taskName: task.taskName,
                    taskKey: task.taskId,
                    projectName: task.projectName?.name || task.projectName,
                    projectKey: task.projectName?.key || 'MOM',
                    completionDate
                });
            }
        });
        
        return res.status(200).json(new ApiResponse(200, {
            currentStreak,
            longestStreak,
            revisionsByDate: revisionLogsByDate,
            completedByDate
        }, "Revision stats fetched successfully"));
    } catch (error) {
        console.error("Error fetching revision stats:", error);
        return res.status(400).json(new ApiError(400, "Error fetching revision stats"));
    }
});

// Get Completed Parent Tasks (Patterns)
tc.getCompletedParents = asyncHandler(async (req, res) => {
    try {
        const filter = {
            parentTask: null,
            status: "done"
        };
        
        if (req.branchId) {
            filter.branchId = new mongoose.Types.ObjectId(req.branchId);
        }
        if (req.user?.email !== "balajiaadi2000@gmail.com") {
            filter.createdBy = req.user._id;
        }

        const completedParents = await Task.find(filter)
            .populate("projectName", "name key")
            .select("taskName taskId status projectName")
            .lean();

        return res.status(200).json(
            new ApiResponse(200, completedParents, "Completed parent tasks retrieved successfully")
        );
    } catch (error) {
        console.error("Error fetching completed parent tasks:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error fetching completed parent tasks"));
    }
});

// Suggest Revision Challenge using AI
tc.suggestRevisionChallenge = asyncHandler(async (req, res) => {
    const { parentTaskId } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new ApiError(500, "Groq API key is not configured on backend server");
    }

    let parentTask = null;
    if (parentTaskId && parentTaskId !== "random") {
        parentTask = await Task.findById(parentTaskId).populate("projectName");
        if (!parentTask) {
            throw new ApiError(404, "Selected parent task not found");
        }
    } else {
        // Pick a random completed parent task
        const filter = { parentTask: null, status: "done" };
        if (req.branchId) {
            filter.branchId = new mongoose.Types.ObjectId(req.branchId);
        }
        if (req.user?.email !== "balajiaadi2000@gmail.com") {
            filter.createdBy = req.user._id;
        }
        
        // Exclude projects with key ESP
        const eligibleProjects = await Project.find({ key: { $ne: "ESP" } }).select("_id");
        const eligibleProjectIds = eligibleProjects.map(p => p._id);
        filter.projectName = { $in: eligibleProjectIds };

        const completedParents = await Task.find(filter).populate("projectName");
        if (completedParents.length === 0) {
            throw new ApiError(400, "No completed parent tasks found. Please complete a parent pattern task first.");
        }
        parentTask = completedParents[Math.floor(Math.random() * completedParents.length)];
    }

    if (parentTask.projectName?.key === "ESP") {
        throw new ApiError(400, "AI Challenges are disabled for ESP Arena");
    }

    // Fetch child tasks (solved problems) under this parent task
    const childTasks = await Task.find({ parentTask: parentTask._id }).select("taskName").lean();
    const solvedProblems = childTasks.map(t => t.taskName);
    const solvedProblemsStr = solvedProblems.length > 0 
        ? solvedProblems.map((p, i) => `${i+1}. ${p}`).join("\n") 
        : "None (no solved problems yet under this pattern)";

    const prompt = `
You are an expert DSA (Data Structures and Algorithms) coach.
The user is revising the coding pattern/topic: "${parentTask.taskName}".
They have already solved the following problems under this pattern:
${solvedProblemsStr}

Task:
Suggest a random, high-quality coding problem of Medium difficulty that fits this pattern ("${parentTask.taskName}").
The problem must:
1. Be from a well-known coding platform (LeetCode, Codeforces, or GeeksforGeeks).
2. NOT be in the solved problems list above.
3. Have been asked in past technical interviews at major companies (like Google, Amazon, Microsoft, Meta, Netflix, Uber, etc.).

You MUST respond ONLY with a valid JSON object matching the schema below.

JSON Schema:
{
  "parentTaskId": "${parentTask._id}",
  "parentTaskName": "${parentTask.taskName}",
  "problemTitle": "Clean title of the problem (e.g. 'LeetCode 3: Longest Substring Without Repeating Characters')",
  "platform": "LeetCode / Codeforces / GeeksforGeeks",
  "problemUrl": "Provide a valid direct URL to the problem, or a search URL on the platform if direct link is unknown",
  "companies": ["Company1", "Company2"],
  "description": "A very concise 1-2 sentence description of the problem's task/rules",
  "hint": "A helpful hint on how to approach this problem specifically using the '${parentTask.taskName}' pattern"
}
`;

    try {
        const response = await axios.post(
            `https://api.groq.com/openai/v1/chat/completions`,
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: {
                    type: "json_object"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let responseText = response.data?.choices?.[0]?.message?.content || "";
        const challenge = JSON.parse(responseText.trim());

        return res.status(200).json(
            new ApiResponse(200, challenge, "AI revision challenge generated successfully")
        );
    } catch (error) {
        console.error("Groq Revision Challenge Suggestion Error:", error.response?.data || error.message);
        throw new ApiError(500, `AI challenge generation failed: ${error.message}`);
    }
});

// Get Daily Revision
tc.getDailyRevision = asyncHandler(async (req, res) => {
    try {
        const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : 0;
        const localDateStr = getLocalDateString(new Date(), timezoneOffset);
        
        let dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isCompleted: false
        }).populate("questions").populate("completedQuestions").populate("reviseTomorrowQuestions");

        if (!dailyRev) {
            dailyRev = await DailyRevision.findOne({
                userId: req.user._id,
                dateStr: localDateStr
            }).populate("questions").populate("completedQuestions").populate("reviseTomorrowQuestions");
        }

        // Dynamic database fix: Truncate any active revision with > 4 questions to exactly 4
        if (dailyRev && dailyRev.questions && dailyRev.questions.length > 4) {
            const completedSet = new Set((dailyRev.completedQuestions || []).map(q => (q._id || q).toString()));
            
            // Keep completed questions
            const finalQuestions = dailyRev.questions.filter(q => completedSet.has((q._id || q).toString()));
            
            // Keep pending questions in original order
            const pendingQuestions = dailyRev.questions.filter(q => !completedSet.has((q._id || q).toString()));
            
            // Fill up remaining slots to make exactly 4 questions
            const neededCount = Math.max(0, 4 - finalQuestions.length);
            finalQuestions.push(...pendingQuestions.slice(0, neededCount));
            
            dailyRev.questions = finalQuestions.map(q => q._id || q);
            await dailyRev.save();

            // Refetch to ensure populated state is updated
            dailyRev = await DailyRevision.findById(dailyRev._id)
                .populate("questions")
                .populate("completedQuestions")
                .populate("reviseTomorrowQuestions");
        }

        if (!dailyRev) {
            // Find projects with key DSA and DSAP2
            const projects = await Project.find({ key: { $in: ["DSA", "DSAP2"] } }).select("_id");
            const projectIds = projects.map(p => p._id);

            // Fetch completed subtasks
            const filter = {
                projectName: { $in: projectIds },
                parentTask: { $ne: null },
                status: "done"
            };
            if (req.branchId) {
                filter.branchId = new mongoose.Types.ObjectId(req.branchId);
            }
            if (req.user?.email !== "balajiaadi2000@gmail.com") {
                filter.createdBy = req.user._id;
            }

            const allEligibleTasks = await Task.find(filter).select("_id taskName revisionLogs").lean();

            // Fetch past 5 days of selections to prevent duplicates
            const pastRevisions = await DailyRevision.find({ userId: req.user._id })
                .sort({ dateStr: -1 })
                .limit(5)
                .lean();

            const recentlySelectedIds = new Set();
            pastRevisions.forEach(rev => {
                if (rev.questions) {
                    rev.questions.forEach(q => recentlySelectedIds.add(q.toString()));
                }
            });

            // Check for revise tomorrow questions from the last revision session
            const lastRev = await DailyRevision.findOne({ userId: req.user._id })
                .sort({ dateStr: -1 })
                .lean();
            const reviseTomorrowIds = lastRev ? (lastRev.reviseTomorrowQuestions || []) : [];
            const reviseTomorrowStrSet = new Set(reviseTomorrowIds.map(id => id.toString()));

            // Filter out recently selected tasks AND any already pinned reviseTomorrow tasks
            let availableTasks = allEligibleTasks.filter(t => 
                !recentlySelectedIds.has(t._id.toString()) &&
                !reviseTomorrowStrSet.has(t._id.toString())
            );

            // Fallbacks if not enough tasks are available after filtering
            if (availableTasks.length < 4) {
                const yesterdayRev = pastRevisions[0];
                const yesterdayIds = new Set(yesterdayRev ? yesterdayRev.questions.map(q => q.toString()) : []);
                availableTasks = allEligibleTasks.filter(t => 
                    !yesterdayIds.has(t._id.toString()) &&
                    !reviseTomorrowStrSet.has(t._id.toString())
                );
            }

            if (availableTasks.length < 4) {
                availableTasks = allEligibleTasks.filter(t => !reviseTomorrowStrSet.has(t._id.toString()));
            }

            // Pin limit: maximum of 4
            const activePins = reviseTomorrowIds.slice(0, 4);
            const randomCountNeeded = Math.max(0, 4 - activePins.length);

            // Pick remaining tasks from availableTasks (Balancing 50% Revised & 50% Unrevised)
            const selectedTasks = [];
            if (randomCountNeeded > 0) {
                const unrevisedPool = availableTasks.filter(t => !t.revisionLogs || t.revisionLogs.length === 0);
                const revisedPool = availableTasks.filter(t => t.revisionLogs && t.revisionLogs.length > 0);

                // Target half unrevised, half revised
                let targetUnrevised = Math.ceil(randomCountNeeded / 2);
                let targetRevised = Math.floor(randomCountNeeded / 2);

                // Adjust targets if one pool doesn't have enough items
                if (unrevisedPool.length < targetUnrevised) {
                    targetRevised += (targetUnrevised - unrevisedPool.length);
                    targetUnrevised = unrevisedPool.length;
                }
                if (revisedPool.length < targetRevised) {
                    targetUnrevised += (targetRevised - revisedPool.length);
                    targetUnrevised = Math.min(unrevisedPool.length, targetUnrevised);
                    targetRevised = revisedPool.length;
                }

                // Pick from unrevised (shuffled randomly)
                const shuffledUnrevised = [...unrevisedPool].sort(() => 0.5 - Math.random());
                const chosenUnrevised = shuffledUnrevised.slice(0, targetUnrevised);

                // Pick from revised (prioritize lower revision count / spaced repetition, with random shuffle for ties)
                const sortedRevised = [...revisedPool].sort((a, b) => {
                    const countA = a.revisionLogs ? a.revisionLogs.length : 0;
                    const countB = b.revisionLogs ? b.revisionLogs.length : 0;
                    if (countA !== countB) return countA - countB;
                    return 0.5 - Math.random();
                });
                const chosenRevised = sortedRevised.slice(0, targetRevised);

                selectedTasks.push(...chosenUnrevised, ...chosenRevised);

                // Ultimate fallback if still short of randomCountNeeded
                if (selectedTasks.length < randomCountNeeded) {
                    const chosenIds = new Set(selectedTasks.map(t => t._id.toString()));
                    const remainingFallback = availableTasks.filter(t => !chosenIds.has(t._id.toString()));
                    const shuffledFallback = [...remainingFallback].sort(() => 0.5 - Math.random());
                    selectedTasks.push(...shuffledFallback.slice(0, randomCountNeeded - selectedTasks.length));
                }
            }

            // Combine pinned and new random questions to make exactly 4 total
            const finalQuestions = [...activePins, ...selectedTasks.map(t => t._id)];

            // Create new record
            dailyRev = await DailyRevision.create({
                userId: req.user._id,
                dateStr: localDateStr,
                questions: finalQuestions,
                completedQuestions: [],
                reviseTomorrowQuestions: [],
                isStarted: false,
                isCompleted: false,
                timeLeft: 10800, // 3 hours
                timerIsActive: false,
                timerLastUpdated: null,
                branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : null
            });

            dailyRev = await DailyRevision.findById(dailyRev._id)
                .populate("questions")
                .populate("completedQuestions")
                .populate("reviseTomorrowQuestions");
        } else {
            // Recalculate remaining time if timer is active
            if (dailyRev.timerIsActive && dailyRev.timerLastUpdated && !dailyRev.isCompleted) {
                const now = Date.now();
                const lastUpdate = new Date(dailyRev.timerLastUpdated).getTime();
                const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
                if (elapsedSeconds > 0) {
                    dailyRev.timeLeft = Math.max(0, dailyRev.timeLeft - elapsedSeconds);
                    dailyRev.timerLastUpdated = new Date(now);
                    await dailyRev.save();
                }
            }
        }
        return res.status(200).json(
            new ApiResponse(200, dailyRev, "Daily revision status retrieved successfully")
        );
    } catch (error) {
        console.error("Error retrieving daily revision:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error retrieving daily revision"));
    }
});

// Start Daily Revision
tc.startDailyRevision = asyncHandler(async (req, res) => {
    try {
        const timezoneOffset = req.body.timezoneOffset ? parseInt(req.body.timezoneOffset) : 0;
        const localDateStr = getLocalDateString(new Date(), timezoneOffset);

        let dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isCompleted: false
        });

        if (!dailyRev) {
            dailyRev = await DailyRevision.findOne({
                userId: req.user._id,
                dateStr: localDateStr
            });
        }

        if (!dailyRev) {
            throw new ApiError(404, "Today's daily revision is not generated yet");
        }

        dailyRev.isStarted = true;
        dailyRev.timerIsActive = true;
        dailyRev.timerLastUpdated = new Date();
        dailyRev.currentQuestionStartTimeLeft = 10800;
        await dailyRev.save();

        dailyRev = await DailyRevision.findById(dailyRev._id)
            .populate("questions")
            .populate("completedQuestions")
            .populate("reviseTomorrowQuestions");

        return res.status(200).json(
            new ApiResponse(200, dailyRev, "Daily revision timer started successfully")
        );
    } catch (error) {
        console.error("Error starting daily revision:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error starting daily revision"));
    }
});

// Toggle Daily Revision Timer
tc.toggleDailyRevisionTimer = asyncHandler(async (req, res) => {
    try {
        const timezoneOffset = req.body.timezoneOffset ? parseInt(req.body.timezoneOffset) : 0;
        const localDateStr = getLocalDateString(new Date(), timezoneOffset);

        let dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isCompleted: false
        });

        if (!dailyRev) {
            dailyRev = await DailyRevision.findOne({
                userId: req.user._id,
                dateStr: localDateStr
            });
        }

        if (!dailyRev) {
            throw new ApiError(404, "Today's daily revision is not generated yet");
        }

        if (!dailyRev.isStarted) {
            throw new ApiError(400, "Daily revision has not been started yet");
        }

        if (dailyRev.isCompleted) {
            return res.status(200).json(
                new ApiResponse(200, dailyRev, "Daily revision is already completed")
            );
        }

        if (dailyRev.timerIsActive) {
            // Pause: Calculate elapsed time and update timeLeft
            const now = Date.now();
            const lastUpdate = dailyRev.timerLastUpdated ? new Date(dailyRev.timerLastUpdated).getTime() : now;
            const elapsed = Math.floor((now - lastUpdate) / 1000);
            
            dailyRev.timeLeft = Math.max(0, dailyRev.timeLeft - elapsed);
            dailyRev.timerIsActive = false;
            dailyRev.timerLastUpdated = null;
        } else {
            // Resume
            dailyRev.timerIsActive = true;
            dailyRev.timerLastUpdated = new Date();
        }

        await dailyRev.save();

        dailyRev = await DailyRevision.findById(dailyRev._id)
            .populate("questions")
            .populate("completedQuestions")
            .populate("reviseTomorrowQuestions");

        return res.status(200).json(
            new ApiResponse(200, dailyRev, "Daily revision timer state toggled successfully")
        );
    } catch (error) {
        console.error("Error toggling daily revision timer:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error toggling daily revision timer"));
    }
});

// Sync Daily Revision Timer
tc.syncDailyRevisionTimer = asyncHandler(async (req, res) => {
    try {
        const { timeLeft, timerIsActive, timezoneOffset } = req.body;
        const offset = timezoneOffset !== undefined ? parseInt(timezoneOffset) : 0;
        const localDateStr = getLocalDateString(new Date(), offset);

        let dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isCompleted: false
        });

        if (!dailyRev) {
            dailyRev = await DailyRevision.findOne({
                userId: req.user._id,
                dateStr: localDateStr
            });
        }

        if (!dailyRev) {
            throw new ApiError(404, "Today's daily revision is not generated yet");
        }

        if (timeLeft !== undefined) {
            dailyRev.timeLeft = Math.max(0, parseInt(timeLeft));
        }

        if (timerIsActive !== undefined) {
            dailyRev.timerIsActive = !!timerIsActive;
            dailyRev.timerLastUpdated = dailyRev.timerIsActive ? new Date() : null;
        }

        await dailyRev.save();

        return res.status(200).json(
            new ApiResponse(200, dailyRev, "Daily revision timer synced successfully")
        );
    } catch (error) {
        console.error("Error syncing daily revision timer:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error syncing daily revision timer"));
    }
});

// Toggle Revise Tomorrow
tc.toggleReviseTomorrow = asyncHandler(async (req, res) => {
    try {
        const { taskId, reviseTomorrow, timezoneOffset } = req.body;
        const offset = timezoneOffset !== undefined ? parseInt(timezoneOffset) : 0;
        const localDateStr = getLocalDateString(new Date(), offset);

        let dailyRev = await DailyRevision.findOne({
            userId: req.user._id,
            isCompleted: false
        });

        if (!dailyRev) {
            dailyRev = await DailyRevision.findOne({
                userId: req.user._id,
                dateStr: localDateStr
            });
        }

        if (!dailyRev) {
            throw new ApiError(404, "Today's daily revision is not generated yet");
        }

        if (!dailyRev.reviseTomorrowQuestions) {
            dailyRev.reviseTomorrowQuestions = [];
        }

        const taskObjectId = new mongoose.Types.ObjectId(taskId);
        if (reviseTomorrow) {
            const alreadyExists = dailyRev.reviseTomorrowQuestions.some(id => id.toString() === taskId.toString());
            if (!alreadyExists) {
                dailyRev.reviseTomorrowQuestions.push(taskObjectId);
            }
        } else {
            dailyRev.reviseTomorrowQuestions = dailyRev.reviseTomorrowQuestions.filter(
                id => id.toString() !== taskId.toString()
            );
        }

        await dailyRev.save();

        dailyRev = await DailyRevision.findById(dailyRev._id)
            .populate("questions")
            .populate("completedQuestions")
            .populate("reviseTomorrowQuestions");

        return res.status(200).json(
            new ApiResponse(200, dailyRev, "Revise tomorrow preference updated successfully")
        );
    } catch (error) {
        console.error("Error toggling revise tomorrow:", error);
        return res.status(500).json(new ApiError(500, error.message || "Error toggling revise tomorrow"));
    }
});

export default tc;