import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Task } from "../../models/task.model.js";
import { Project } from "../../models/project.model.js";
import { Sprint } from "../../models/sprint.model.js";
import mongoose from "mongoose";
import { calculateStatusDuration } from "../../utils/calculateStatusDuration.js";
import { Notification } from "../../models/notification.model.js";
import notificationService from "../notification-service/notification.service.js";
import { socketService } from "../../socket-instance.js";
import { ProgressService } from "../progress-service/progress.service.js";
import AnalyticsService from "../analytics-service/analytics.service.js";

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
      attachments,
      milestone: milestone || null,
      status,
      progress: progress || 0,
      createdBy: req.user?._id,
      parentTask: parentTask || null,
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
    if (status !== undefined) updateFields.status = status;
    if (progress !== undefined) updateFields.progress = progress;
    if (status === 'done') updateFields.progress = 100;
    else if (status === 'todo' && progress === undefined) updateFields.progress = 0;
    
    updateFields.updatedBy = req.user?._id;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
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


import { checkAndTransitionTasks } from "./taskTransition.job.js";

// get all tasks
tc.getallTasks = asyncHandler(async (req, res) => {
  console.log("req.body--->", req.body);
  
  try {
    const { search = "" } = req.query;
    let { filter = {}, sortOrder = -1 } = req.body;
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

    // Role-based filtering logic using Permissions
    // If user acts as 'Employee' (VIEW_ASSIGNED_TASK only) and NOT 'Manager' (VIEW_ALL_PROJECTS/VIEW_TASK generic)
    // We need to be careful. 
    // ADMIN / PM has 'VIEW_ALL_PROJECTS' or 'VIEW_TASK' (global).
    // EMPLOYEE has 'VIEW_ASSIGNED_TASK'.
    
    const canViewAll = permissions.has('VIEW_ALL_PROJECTS') || permissions.has('VIEW_TASK');
    const mustViewAssigned = permissions.has('VIEW_ASSIGNED_TASK');

    if (!canViewAll && mustViewAssigned) {
         filter.assignee = req.user._id;
    }
    // If they have NEITHER, they see nothing (or handle as 403, but here just empty list is fine)
    if (!canViewAll && !mustViewAssigned) {
        // Fallback: if no specific view permission, maybe return nothing or keep existing behavior?
        // Let's assume strict RBAC:
        return res.status(200).json(new ApiResponse(200, [], "No tasks found (Insufficient permissions)"));
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
    .populate("parentTask", "taskName taskId")
    .populate({
      path: "createdBy",
      select: "firstName lastName email"
    })
    .sort({ _id: sortOrder })
    .lean();
  
    // Map tasks to include pre-calculated duration
    tasks.forEach(task => {
        task.duration = calculateStatusDuration(task.activityLogs || []);
    });
  

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

// Add Revision
tc.addRevision = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { notes, revisionDate } = req.body;

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

    return res.status(200).json(new ApiResponse(200, task, "Revision logged successfully"));
});

export default tc;