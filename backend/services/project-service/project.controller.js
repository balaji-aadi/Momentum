import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Project } from "../../models/project.model.js";
import { UserTaskProgress } from "../../models/userTaskProgress.model.js";
import { UserArenaSchedule } from "../../models/userArenaSchedule.model.js";
import mongoose from "mongoose";
import moment from "moment";
import { Milestone } from "../../models/milestone.model.js";
import { Task } from "../../models/task.model.js";

const isUserAdmin = (user) => {
  if (!user) return false;
  if (user.email === "balajiaadi2000@gmail.com") return true;
  if (user.role === "admin") return true;
  if (user.userRole?.name?.toLowerCase() === "admin") return true;
  if (Array.isArray(user.userRoles) && user.userRoles.some(r => r.name?.toLowerCase() === "admin" || (r.active && r.permissions?.some(p => ["CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT"].includes(p.name))))) return true;
  return false;
};

const pc = {}

// create Project
pc.createProject = asyncHandler(async (req, res) => {
  console.log("Req.body", req.body);

  try {
    if (!isUserAdmin(req.user)) {
      return res.status(403).json(new ApiError(403, "Forbidden: Only administrators can create canonical Projects/Arenas."));
    }

    const { name, access, key, description, startDate, endDate, priority, clientName, budget, projectManager,
      teamMembers, rolesAndResponsibilities, milestones, status, githubRepository
    } = req.body;

    const requiredFields = { name, access, key, startDate, endDate, priority, projectManager, rolesAndResponsibilities, status };

    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field] || requiredFields[field] === 'undefined');

    if (missingFields.length > 0) {
      return res.status(400).json(new ApiError(400, `Missing required field: ${missingFields.join(', ')}`));
    }

    const completedAt = status === "completed" ? new Date() : null;

    const createdProject = await Project.create({
      name,
      access,
      key,
      description,
      startDate,
      endDate,
      priority,
      clientName,
      githubRepository,
      budget,
      projectManager,
      teamMembers,
      rolesAndResponsibilities,
      status,
      completedAt,
      createdBy: req.user?._id,
      branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : undefined
    });

    if (Array.isArray(milestones) && milestones.length > 0) {
      const milestoneDocs = milestones.map((milestone) => ({
        ...milestone,
        project: createdProject._id,
      }));

      await Milestone.insertMany(milestoneDocs);
    }

    return res.status(201).json(new ApiResponse(201, createdProject, "Project created successfully"));
  } catch (error) {
    console.log("Error------", error)
    return res.status(400).json(new ApiError(404, error, "Error"));
  }
});


//update Project
pc.updateProject = asyncHandler(async (req, res) => {
  console.log("!!! SUPER DISTINCT LOG - Update Project !!!");
  console.log("Req.body keys:", Object.keys(req.body));
  console.log("Github Repo in body:", req.body.githubRepository);

  try {
    if (!isUserAdmin(req.user)) {
      return res.status(403).json(new ApiError(403, "Forbidden: Only administrators can update canonical Projects/Arenas."));
    }

    if (req.params.projectId == "undefined" || !req.params.projectId) {
      return res.status(400).json(new ApiError(400, "id not provided"));
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json(new ApiError(400, "No data provided to update"));
    }

    const { name, access, key, description, startDate, endDate, priority, clientName, budget, projectManager,
      teamMembers, rolesAndResponsibilities, milestones, status, githubRepository, settings
    } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    let completedAt = project.completedAt;
    if (status === "completed") {
      if (!completedAt) {
        const { ProgressService } = await import("../progress-service/progress.service.js");
        completedAt = await ProgressService.getActualProjectCompletionDate(req.params.projectId);
      }
    } else {
      completedAt = null;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      {
        name,
        access,
        key,
        description,
        startDate,
        endDate,
        priority,
        clientName,
        githubRepository,
        budget,
        projectManager,
        teamMembers,
        rolesAndResponsibilities,
        milestones,
        status,
        completedAt,
        settings,
        updatedBy: req.user?._id
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(404, error, "Error"));
  }

});


// Get project by id
pc.getProjectById = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined") {
      return res.status(400).json(new ApiError(400, "Project ID not provided"));
    }

    const project = await Project.findById(projectId)
      .populate("projectManager teamMembers");

    if (!project) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    const milestones = await Milestone.find({ project: projectId });

    const projectWithMilestones = {
      ...project.toObject(),
      milestones,
    };

    return res.status(200).json(new ApiResponse(200, projectWithMilestones, "Project fetched successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(400, error.message || "Error fetching project"));
  }
});


// Get all active project
pc.getAllProject = asyncHandler(async (req, res) => {
  console.log("req.body...", req.body);

  try {
    const { search = "" } = req.query;
    const { filter = {}, sortOrder = -1 } = req.body;

    // Filter logic
    let filterQuery = {};
    if (req.branchId) {
        filterQuery.branchId = new mongoose.Types.ObjectId(req.branchId);
    }

    // 1. Search Query
    if (search && search !== "undefined") {
      const regex = new RegExp(search, "i");
      let objectIdSearch = null;

      if (mongoose.Types.ObjectId.isValid(search)) {
        objectIdSearch = new mongoose.Types.ObjectId(search);
      }

      filterQuery.$or = [
        { name: { $regex: regex } },
        { startDate: { $regex: regex } },
        { endDate: { $regex: regex } },
        { "rolesAndResponsibilities.role": { $regex: regex } },
        { "rolesAndResponsibilities.responsibility": { $regex: regex } },
        { "rolesAndResponsibilities.teamMember.name": { $regex: regex } },
        { status: { $regex: regex } }
      ];

      if (objectIdSearch) {
        filterQuery.$or.push(
          { teamMembers: objectIdSearch },
          { "rolesAndResponsibilities.teamMember": objectIdSearch }
        );
      }
    }

    if (filter?.type === "active") {
      filterQuery.status = "active";
    }

    let projects = await Project.find(filterQuery)
      .populate("projectManager teamMembers rolesAndResponsibilities.teamMember")
      .sort({ _id: sortOrder });

    if (!projects.length) {
      return res.status(200).json(new ApiResponse(200, [], "No projects found"));
    }

    const projectIds = projects.map(p => p._id);
    const allMilestones = await Milestone.find({ project: { $in: projectIds } });

    // Canonical total task counts per project
    const canonicalTaskStats = await Task.aggregate([
      { $match: { projectName: { $in: projectIds } } },
      {
        $group: {
          _id: "$projectName",
          totalTasks: { $sum: 1 }
        }
      }
    ]);

    const totalTasksMap = canonicalTaskStats.reduce((acc, stat) => {
      acc[stat._id.toString()] = stat.totalTasks;
      return acc;
    }, {});

    // Authenticated user's completed tasks per project from UserTaskProgress
    const userCompletedStats = await UserTaskProgress.aggregate([
      {
        $match: {
          userId: req.user?._id,
          projectName: { $in: projectIds },
          status: "done"
        }
      },
      {
        $group: {
          _id: "$projectName",
          completedTasks: { $sum: 1 }
        }
      }
    ]);

    const userCompletedMap = userCompletedStats.reduce((acc, stat) => {
      acc[stat._id.toString()] = stat.completedTasks;
      return acc;
    }, {});

    const formattedProjects = projects.map((project) => {
      const teamMembers = project.teamMembers.map((member) => {
        const rolesAndResponsibilities = project.rolesAndResponsibilities
          .filter((role) => role.teamMember?._id.toString() === member._id.toString())
          .map((role) => ({
            role: role.role,
            responsibility: role.responsibility
          }));

        return { ...member.toObject(), rolesAndResponsibilities };
      });

      const projectMilestones = allMilestones
        .filter(m => m.project.toString() === project._id.toString())
        .map(m => m.toObject());

      const total = totalTasksMap[project._id.toString()] || 0;
      const completed = userCompletedMap[project._id.toString()] || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...project.toObject(),
        teamMembers,
        milestones: projectMilestones,
        taskStats: {
          total,
          completed,
          percentage
        }
      };
    });

    return res.status(200).json(new ApiResponse(200, formattedProjects, "Projects fetched successfully"));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(400).json(new ApiError(400, error.message || "Internal Server Error"));
  }
});


import { Sprint } from "../../models/sprint.model.js";

//delete Project
pc.deleteProject = asyncHandler(async (req, res) => {
  console.log("Req.params", req.params);

  try {
    if (!isUserAdmin(req.user)) {
      return res.status(403).json(new ApiError(403, "Forbidden: Only administrators can delete canonical Projects/Arenas."));
    }

    const { projectId } = req.params;

    if (!projectId || projectId === "undefined") {
      return res.status(400).json(new ApiError(400, "Project ID not provided"));
    }

    // 1. Delete all Tasks associated with the project
    await Task.deleteMany({ projectName: projectId });

    // 2. Delete all Milestones associated with the project
    await Milestone.deleteMany({ project: projectId });

    // 3. Delete all Sprints associated with the project
    await Sprint.deleteMany({ project: projectId });

    // 4. Finally, delete the Project itself
    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedProject, "Project and all associated data deleted successfully"));
  } catch (error) {
    console.log("Error------", error);
    return res.status(400).json(new ApiError(400, error.message || "Error deleting project"));
  }
});

// Schedule Arena / Timeline Generator
pc.scheduleArena = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { startDate, tasksPerDay = 4, revisionDaysPerParent = 2, targetMonths } = req.body;

    if (!projectId || projectId === "undefined") {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    if (!startDate) {
      return res.status(400).json(new ApiError(400, "Start date is required"));
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json(new ApiError(404, "Arena/Project not found"));
    }

    // 0. Enforce One-Time Scheduling Rule
    const existingSchedule = await UserArenaSchedule.findOne({ userId, projectId }).lean();
    if (existingSchedule) {
      return res.status(400).json(
        new ApiError(
          400,
          "This Arena is already scheduled. Arena timeline scheduling is a one-time setup and cannot be rescheduled."
        )
      );
    }

    const numTasksPerDay = Math.max(1, parseInt(tasksPerDay) || 4);
    const numRevisionDays = Math.max(0, parseInt(revisionDaysPerParent) || 0);

    // 1. Fetch canonical parent tasks (topics)
    const parentTasks = await Task.find({
      projectName: projectId,
      $or: [{ parentTask: null }, { parentTask: { $exists: false } }]
    }).sort({ order: 1, createdAt: 1 }).lean();

    // 2. Fetch canonical child tasks
    const childTasks = await Task.find({
      projectName: projectId,
      parentTask: { $ne: null, $exists: true }
    }).sort({ order: 1, createdAt: 1 }).lean();

    if (childTasks.length === 0 && parentTasks.length === 0) {
      return res.status(400).json(new ApiError(400, "Cannot schedule an empty Arena with no tasks."));
    }

    // 3. Group child tasks by parent
    const childrenByParent = new Map();
    parentTasks.forEach(p => childrenByParent.set(p._id.toString(), []));

    const orphanChildren = [];
    childTasks.forEach(c => {
      const pId = c.parentTask ? (typeof c.parentTask === 'object' ? c.parentTask._id : c.parentTask).toString() : null;
      if (pId && childrenByParent.has(pId)) {
        childrenByParent.get(pId).push(c);
      } else {
        orphanChildren.push(c);
      }
    });

    // 4. Run schedule timeline algorithm
    let currentDate = moment.utc(startDate).startOf('day');
    const startCalendarDate = currentDate.clone();
    const childUpdates = [];
    const parentUpdates = [];
    let totalScheduledChildTasks = 0;
    let totalScheduledParents = 0;

    // Schedule parents with their children
    parentTasks.forEach((parent, pIndex) => {
      const children = childrenByParent.get(parent._id.toString()) || [];
      if (children.length === 0) return;

      totalScheduledParents++;
      const parentStart = currentDate.clone().toDate();

      for (let i = 0; i < children.length; i += numTasksPerDay) {
        const chunk = children.slice(i, i + numTasksPerDay);
        const dayStart = currentDate.clone().toDate();
        const dayEnd = currentDate.clone().endOf('day').toDate();

        chunk.forEach(child => {
          childUpdates.push({
            taskId: child._id,
            startDate: dayStart,
            dueDate: dayEnd,
            projectName: projectId
          });
          totalScheduledChildTasks++;
        });

        // If there are more tasks for this parent topic, advance date by 1 day
        if (i + numTasksPerDay < children.length) {
          currentDate.add(1, 'days');
        }
      }

      const parentDue = currentDate.clone().endOf('day').toDate();
      parentUpdates.push({
        taskId: parent._id,
        startDate: parentStart,
        dueDate: parentDue,
        projectName: projectId
      });

      // Add revision buffer days after parent completes (if not the last parent)
      const isLastParent = pIndex === parentTasks.length - 1 && orphanChildren.length === 0;
      if (!isLastParent && numRevisionDays > 0) {
        currentDate.add(numRevisionDays + 1, 'days');
      } else if (!isLastParent) {
        currentDate.add(1, 'days');
      }
    });

    // Schedule any orphan child tasks
    if (orphanChildren.length > 0) {
      for (let i = 0; i < orphanChildren.length; i += numTasksPerDay) {
        const chunk = orphanChildren.slice(i, i + numTasksPerDay);
        const dayStart = currentDate.clone().toDate();
        const dayEnd = currentDate.clone().endOf('day').toDate();

        chunk.forEach(child => {
          childUpdates.push({
            taskId: child._id,
            startDate: dayStart,
            dueDate: dayEnd,
            projectName: projectId
          });
          totalScheduledChildTasks++;
        });

        if (i + numTasksPerDay < orphanChildren.length) {
          currentDate.add(1, 'days');
        }
      }
    }

    const arenaEndDate = currentDate.clone().endOf('day').toDate();
    const calculatedTotalDays = moment.utc(arenaEndDate).diff(startCalendarDate, 'days') + 1;

    // 5. Target Duration Validation
    if (targetMonths !== undefined && targetMonths !== null && targetMonths !== "") {
      const parsedMonths = parseInt(targetMonths);
      if (parsedMonths > 0) {
        const maxAllowedEndDate = startCalendarDate.clone().add(parsedMonths, 'months').endOf('day');
        const maxAllowedDays = maxAllowedEndDate.diff(startCalendarDate, 'days') + 1;

        if (calculatedTotalDays > maxAllowedDays) {
          return res.status(400).json(
            new ApiError(
              400,
              `Target duration of ${parsedMonths} month(s) (${maxAllowedDays} days) is insufficient. ` +
              `The calculated schedule requires ${calculatedTotalDays} days (${totalScheduledChildTasks} tasks at ${numTasksPerDay}/day + ${numRevisionDays} revision buffer days per topic). ` +
              `Please adjust your start date, increase tasks per day, or choose a longer target duration.`
            )
          );
        }
      }
    }

    // 6. Upsert UserArenaSchedule (Idempotent)
    const schedule = await UserArenaSchedule.findOneAndUpdate(
      { userId: userId, projectId: projectId },
      {
        userId: userId,
        projectId: projectId,
        branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : (project.branchId || null),
        startDate: startCalendarDate.toDate(),
        endDate: arenaEndDate,
        tasksPerDay: numTasksPerDay,
        revisionDaysPerParent: numRevisionDays,
        totalTasks: totalScheduledChildTasks,
        totalParentTasks: totalScheduledParents,
        calculatedTotalDays: calculatedTotalDays
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 7. Bulk update UserTaskProgress records for userId
    const bulkOps = [
      ...childUpdates.map(u => ({
        updateOne: {
          filter: { userId: userId, taskId: u.taskId },
          update: {
            $set: {
              taskStartDate: u.startDate,
              taskDueDate: u.dueDate
            },
            $setOnInsert: {
              status: "todo",
              progress: 0,
              projectName: u.projectName,
              branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : (project.branchId || null)
            }
          },
          upsert: true
        }
      })),
      ...parentUpdates.map(u => ({
        updateOne: {
          filter: { userId: userId, taskId: u.taskId },
          update: {
            $set: {
              taskStartDate: u.startDate,
              taskDueDate: u.dueDate
            },
            $setOnInsert: {
              status: "todo",
              progress: 0,
              projectName: u.projectName,
              branchId: req.branchId ? new mongoose.Types.ObjectId(req.branchId) : (project.branchId || null)
            }
          },
          upsert: true
        }
      }))
    ];

    if (bulkOps.length > 0) {
      await UserTaskProgress.bulkWrite(bulkOps);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          schedule,
          calculatedTotalDays,
          totalTasks: totalScheduledChildTasks,
          totalParentTasks: totalScheduledParents,
          startDate: startCalendarDate.toDate(),
          endDate: arenaEndDate
        },
        "Arena schedule generated and applied successfully"
      )
    );
  } catch (error) {
    console.error("Error scheduling arena:", error);
    return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message || "Error scheduling arena"));
  }
});

// Get User's Arena Schedule
pc.getArenaSchedule = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined") {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    const schedule = await UserArenaSchedule.findOne({ userId: userId, projectId: projectId });

    return res.status(200).json(
      new ApiResponse(200, { isScheduled: !!schedule, schedule }, "Arena schedule retrieved successfully")
    );
  } catch (error) {
    console.error("Error retrieving arena schedule:", error);
    return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message || "Error retrieving arena schedule"));
  }
});

// Reset User's Arena Schedule
pc.resetArenaSchedule = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined") {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    await UserArenaSchedule.findOneAndDelete({ userId: userId, projectId: projectId });

    await UserTaskProgress.updateMany(
      { userId: userId, projectName: projectId },
      { $unset: { taskStartDate: "", taskDueDate: "" } }
    );

    return res.status(200).json(
      new ApiResponse(200, null, "Arena schedule reset successfully")
    );
  } catch (error) {
    console.error("Error resetting arena schedule:", error);
    return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message || "Error resetting arena schedule"));
  }
});

export default pc