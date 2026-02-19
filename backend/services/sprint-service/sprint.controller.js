import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Sprint } from "../../models/sprint.model.js";
import { Project } from "../../models/project.model.js";

const sprintController = {};

// Create Sprint
sprintController.createSprint = asyncHandler(async (req, res) => {
    const { projectId, name, startDate, endDate, goal, status } = req.body;

    if (!projectId || !name || !startDate || !endDate) {
        throw new ApiError(400, "Project ID, Name, Start Date, and End Date are required.");
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const sprint = await Sprint.create({
        project: projectId,
        name,
        startDate,
        endDate,
        goal,
        status: status || 'planned',
        createdBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, sprint, "Sprint created successfully")
    );
});

// Get Sprints by Project
sprintController.getSprintsByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        throw new ApiError(400, "Project ID is required");
    }

    const sprints = await Sprint.find({ project: projectId })
        .sort({ startDate: 1 }); // Sort chronologically

    return res.status(200).json(
        new ApiResponse(200, sprints, "Sprints fetched successfully")
    );
});

// Update Sprint
sprintController.updateSprint = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;
    const { name, startDate, endDate, goal, status } = req.body;

    const sprint = await Sprint.findByIdAndUpdate(
        sprintId,
        {
            $set: {
                name,
                startDate,
                endDate,
                goal,
                status
            }
        },
        { new: true }
    );

    if (!sprint) {
        throw new ApiError(404, "Sprint not found");
    }

    return res.status(200).json(
        new ApiResponse(200, sprint, "Sprint updated successfully")
    );
});

// Delete Sprint
sprintController.deleteSprint = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;

    const sprint = await Sprint.findByIdAndDelete(sprintId);

    if (!sprint) {
        throw new ApiError(404, "Sprint not found");
    }

    return res.status(200).json(
        new ApiResponse(200, sprint, "Sprint deleted successfully")
    );
});

export default sprintController;
