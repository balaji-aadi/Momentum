import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Epic } from "../../models/epic.model.js";

const ec = {};

// Create Epic
ec.createEpic = asyncHandler(async (req, res) => {
  try {
    const { name, summary, project, color, startDate, dueDate, assignee } = req.body;

    if (!name || !project) {
      return res.status(400).json(new ApiError(400, "Name and Project are required"));
    }

    const epic = await Epic.create({
      name,
      summary,
      project,
      color,
      startDate,
      dueDate,
      assignee,
      reporter: req.user?._id
    });

    return res.status(201).json(new ApiResponse(201, epic, "Epic created successfully"));
  } catch (error) {
    console.error("Error creating epic:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error creating epic"));
  }
});

// Update Epic
ec.updateEpic = asyncHandler(async (req, res) => {
  try {
    const { epicId } = req.params;
    const updates = req.body;

    if (!epicId) {
      return res.status(400).json(new ApiError(400, "Epic ID is required"));
    }

    const epic = await Epic.findByIdAndUpdate(epicId, updates, { new: true });

    if (!epic) {
      return res.status(404).json(new ApiError(404, "Epic not found"));
    }

    return res.status(200).json(new ApiResponse(200, epic, "Epic updated successfully"));
  } catch (error) {
    console.error("Error updating epic:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error updating epic"));
  }
});

// Get Epics by Project
ec.getEpicsByProject = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json(new ApiError(400, "Project ID is required"));
    }

    const epics = await Epic.find({ project: projectId }).populate("assignee reporter");

    return res.status(200).json(new ApiResponse(200, epics, "Epics fetched successfully"));
  } catch (error) {
    console.error("Error fetching epics:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error fetching epics"));
  }
});

// Delete Epic
ec.deleteEpic = asyncHandler(async (req, res) => {
  try {
    const { epicId } = req.params;

    if (!epicId) {
      return res.status(400).json(new ApiError(400, "Epic ID is required"));
    }

    const epic = await Epic.findByIdAndDelete(epicId);

    if (!epic) {
      return res.status(404).json(new ApiError(404, "Epic not found"));
    }

    return res.status(200).json(new ApiResponse(200, epic, "Epic deleted successfully"));
  } catch (error) {
    console.error("Error deleting epic:", error);
    return res.status(400).json(new ApiError(400, error.message || "Error deleting epic"));
  }
});

export default ec;
