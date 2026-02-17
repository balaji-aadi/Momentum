import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Sprint } from "../../models/sprint.model.js";

const sc = {};

// Create Sprint
sc.createSprint = asyncHandler(async (req, res) => {
  try {
    const { name, goal, project, startDate, endDate, status } = req.body;

    if (!name || !project) {
      return res.status(400).json(new ApiError(400, "Name and Project are required"));
    }

    const sprint = await Sprint.create({
      name,
      goal,
      project,
      startDate,
      endDate,
      status
    });

    return res.status(201).json(new ApiResponse(201, sprint, "Sprint created successfully"));
  } catch (error) {
    console.error("Error creating sprint:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error creating sprint"));
  }
});

// Update Sprint
sc.updateSprint = asyncHandler(async (req, res) => {
  try {
    const { sprintId } = req.params;
    const updates = req.body;

    if (!sprintId) {
      return res.status(400).json(new ApiError(400, "Sprint ID is required"));
    }

    const sprint = await Sprint.findByIdAndUpdate(sprintId, updates, { new: true });

    if (!sprint) {
      return res.status(404).json(new ApiError(404, "Sprint not found"));
    }

    return res.status(200).json(new ApiResponse(200, sprint, "Sprint updated successfully"));
  } catch (error) {
    console.error("Error updating sprint:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error updating sprint"));
  }
});

// Get Sprints by Project
sc.getSprintsByProject = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    if (!projectId) {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    const query = { project: projectId };
    if (status) {
      query.status = status;
    }

    const sprints = await Sprint.find(query).sort({ startDate: 1 });

    return res.status(200).json(new ApiResponse(200, sprints, "Sprints fetched successfully"));
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error fetching sprints"));
  }
});

// Delete Sprint
sc.deleteSprint = asyncHandler(async (req, res) => {
  try {
    const { sprintId } = req.params;

    if (!sprintId) {
      return res.status(400).json(new ApiError(400, "Sprint ID is required"));
    }

    const sprint = await Sprint.findByIdAndDelete(sprintId);

    if (!sprint) {
      return res.status(404).json(new ApiError(404, "Sprint not found"));
    }

    return res.status(200).json(new ApiResponse(200, sprint, "Sprint deleted successfully"));
  } catch (error) {
    console.error("Error deleting sprint:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error deleting sprint"));
  }
});

export default sc;
