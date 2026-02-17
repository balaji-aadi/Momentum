import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Milestone } from "../../models/milestone.model.js"
import { Task } from "../../models/task.model.js"
import { Project } from "../../models/project.model.js";


const mc = {}

//createMilestone
mc.createMilestone = asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;

      const {
        milestoneName,
        summary,
        commenceDate,
        expectedDate,
        deliverables
      } = req.body;
  
      if (!milestoneName || !commenceDate || !expectedDate) {
        return res.status(400).json(
          new ApiError(400, "Milestone name, commence date, and expected date are required")
        );
      }
  
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json(new ApiError(404, "Project not found"));
      }
  
      const milestone = await Milestone.create({
        project: projectId,
        milestoneName,
        summary,
        commenceDate,
        expectedDate,
        deliverables
      });
  
      return res
        .status(201)
        .json(new ApiResponse(201, milestone, "Milestone created successfully"));
    } catch (error) {
      console.error("Error creating milestone:", error);
      return res
        .status(500)
        .json(new ApiError(500, "Failed to create milestone"));
    }
});
  

//updatemilestone
mc.updateMilestone = asyncHandler(async (req, res) => {
    console.log("req.body", req.body)
    console.log("req.params", req.params)

    try {
        const { milestoneId } = req.params

        const { projectId, milestoneName, summary, commenceDate, expectedDate, deliverables } = req.body

        const requiredFields = { projectId, milestoneName, commenceDate, expectedDate }

        const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field] || requiredFields[field] === 'undefined');

        if (missingFields.length > 0) {
            return res.status(400).json(new ApiError(400, `Missing required field: ${missingFields.join(', ')}`));
        }

        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json(new ApiError(404, "Milestone not found"));
        }

        const updateMilestone = await Milestone.findByIdAndUpdate(
            milestoneId,
            {
                project: projectId,
                milestoneName,
                summary,
                commenceDate,
                expectedDate,
                deliverables
            },
            { new: true }
        )

        return res.status(200).json(new ApiResponse(200, updateMilestone, "Milestone updated successfully"));
    } catch (error) {
        console.log("Error------", error)
        return res.status(400).json(new ApiError(404, error, "Error"));
    }
})


//get milestone by id
mc.getMilestonebyId = asyncHandler(async (req, res) => {
    console.log("req.params", req.params)

    try {
        const { milestoneId } = req.params

        if (!milestoneId || milestoneId === "undefined") {
            return res.status(400).json(new ApiError(400, "Project ID not provided"));
        }

        const milestone = await Milestone.findById(milestoneId)
            .populate("milestoneName", "summary commenceDate expectedDate deliverables")

        if (!milestone) {
            return res.status(400).json(new ApiError(400, "No Milestone Found"))
        }

        return res.status(200).json(new ApiResponse(202, milestone, "Milestone fetched Successfully"))
    } catch (error) {
        console.log("Error------", error);
        return res.status(400).json(new ApiError(404, "Error"));
    }
})


//get all milestone
mc.getAllMilestone = asyncHandler(async (req, res) => {
    console.log("req.body", req.body);

    const { search = "" } = req.query;
    const { filter = {}, sortOrder = -1 } = req.body;

    try {
        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, "i");
            query.$or = [
                { milestoneName: searchRegex },
                { summary: searchRegex }
            ];
        }

        Object.assign(query, filter);

        const milestones = await Milestone.find(query)
            .populate("project", "name startDate endDate priority")
            .sort({ createdAt: sortOrder });

        if (!milestones.length) {
            return res.status(404).json(new ApiError(404, "No milestones found"));
        }

        return res.status(200).json(new ApiResponse(200, milestones, "Milestones fetched successfully"));
    } catch (error) {
        console.log("Error------", error);
        return res.status(400).json(new ApiError(400, "Error fetching milestones"));
    }
});


//delete milestone
mc.deleteMilestone = asyncHandler(async (req, res) => {
    console.log("req.params", req.params);
  
    try {
      const { milestoneId } = req.params;
  
      const linkedTasks = await Task.find({ milestone: milestoneId });
  
      if (linkedTasks.length > 0) {
        return res
          .status(203)
          .json(new ApiResponse(203, null, "This milestone can't be deleted — tasks are linked."));
      }
  
      const deletedMilestone = await Milestone.findByIdAndDelete(milestoneId);
  
      if (!deletedMilestone) {
        return res.status(404).json(new ApiError(404, "Milestone not found"));
      }
  
      return res
        .status(200)
        .json(new ApiResponse(200, deletedMilestone, "Milestone deleted successfully"));
    } catch (error) {
      console.error("Error deleting milestone:", error);
      return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});
  
  

export default mc