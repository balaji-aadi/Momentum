import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activity } from "../../models/activity.model.js";
import { Task } from "../../models/task.model.js";
import { TestCase } from "../../models/testTask.model.js";
import { Bug } from "../../models/bug.model.js";
import mongoose from "mongoose";

const validateReferenceId = async (type, referenceId) => {
  let model;
  switch (type) {
    case "Task":
      model = Task;
      break;
    case "Testcase":
      model = TestCase;
      break;
    case "Bug":
      model = Bug;
      break;
  }

  console.log(`Validating ${type} with referenceId: ${referenceId}`);
  
  const exists = await model.exists({ _id: referenceId });
  console.log(`Reference exists: ${exists}`);
  
  return exists;
};


const at = {};


// Create Activity
at.createActivity = asyncHandler(async (req, res) => {
  console.log("req.body", req.body);

  try {
    const {
      activityType,
      type,
      referenceId,
      summary,
      dueDate,
      assignee,
      title,
      description,
      meetingStartDate,
      meetingEndDate,
      attendees,
    } = req.body;

    if (!activityType || !type || !referenceId || !summary || !dueDate || !assignee) {
      return res.status(400).json(new ApiError(400, "Missing required fields"));
    }

    const isValidReference = await validateReferenceId(type, referenceId);
    if (!isValidReference) {
      return res.status(400).json(new ApiError(400, `Invalid referenceId for type ${type}`));
    }

    if (activityType === "Meeting" && (!meetingStartDate || !meetingEndDate || !attendees?.length)) {
      return res.status(400).json(new ApiError(400, "Meeting fields are required for meetings"));
    }

    const newActivity = await Activity.create({
      activityType,
      type,
      referenceId,
      summary,
      dueDate,
      assignee,
      title,
      description,
      meetingStartDate: activityType === "Meeting" ? meetingStartDate : null,
      meetingEndDate: activityType === "Meeting" ? meetingEndDate : null,
      attendees: activityType === "Meeting" ? attendees : [],
      status: "Pending",
    });

    res.status(201).json(new ApiResponse(201, newActivity, "Activity created successfully"));
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json(new ApiError(500, error.message, "Internal server error"));
  }
});


// Update Activity
at.updateActivity = asyncHandler(async (req, res) => {
  console.log("req.body", req.body);

  try {
    const { activityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json(new ApiError(400, "Invalid Activity ID format"));
    }

    const existingActivity = await Activity.findById(activityId);
    if (!existingActivity) {
      return res.status(404).json(new ApiError(404, "Activity Not Found"));
    }

    const { type, referenceId, activityType, meetingStartDate, meetingEndDate, attendees, ...updateFields } = req.body;

    if (referenceId && type && !(await validateReferenceId(type, referenceId))) {
      return res.status(400).json(new ApiError(400, `Invalid referenceId for type ${type}`));
    }

    if (type) updateFields.type = type;
    if (activityType) updateFields.activityType = activityType;
    if (meetingStartDate) updateFields.meetingStartDate = meetingStartDate;
    if (meetingEndDate) updateFields.meetingEndDate = meetingEndDate;
    if (attendees) updateFields.attendees = attendees;

    if (activityType === "Meeting") {
      if (!meetingStartDate || !meetingEndDate) {
        return res.status(400).json(new ApiError(400, "Meeting start and end dates are required"));
      }
      if (new Date(meetingStartDate) >= new Date(meetingEndDate)) {
        return res.status(400).json(new ApiError(400, "meetingStartDate must be before meetingEndDate"));
      }
      if (!Array.isArray(attendees) || attendees.length === 0) {
        return res.status(400).json(new ApiError(400, "Attendees must be a non-empty array"));
      }
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      activityId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Activity updated successfully",
      data: updatedActivity,
    });
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});


// Get activivity by ID
at.getActivityById = asyncHandler(async (req, res) => {
  try {
    const { activityId } = req.params;

    console.log(`Fetching activity with ID: ${activityId}`);

    const activity = await Activity.findById(activityId)
      .populate("assignee", "firstName lastName phoneNumber email profileImage role");
 
    if (!activity) {
      return res.status(404).json(new ApiError(404, "Activity not found"));
    }

    res.status(200).json(new ApiResponse(200, activity, "Activity retrieved successfully"));
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json(new ApiError(500, error.message, "Internal server error"));
  }
});


// Get All Activities
at.getAllActivities = asyncHandler(async (req, res) => {
  console.log("Req.body----->", req.body);

  try {
    const { type, referenceId, status } = req.body;
    
    const isValidReference = await validateReferenceId(type, referenceId);
    if (!isValidReference) {
      return res.status(400).json(new ApiError(400, `Invalid referenceId for type ${type}`));
    }

    const filter = { type, referenceId };
    if (status) filter.status = status;

    const activities = await Activity.find(filter)
      .populate("assignee", "firstName lastName phoneNumber email profileImage role");

    res.status(200).json(new ApiResponse(200, activities, "Filtered activities retrieved successfully"));
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json(new ApiError(500, error.message, "Internal server error"));
  }
});


// Delete Activity
at.deleteActivity = asyncHandler(async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!activityId) {
      return res.status(400).json(new ApiError(400, "Activity ID not provided"));
    }

    const activity = await Activity.findByIdAndDelete(activityId);
    if (!activity) {
      return res.status(404).json(new ApiError(404, "Activity not found"));
    }

    return res.status(200).json(new ApiResponse(200, activity, "Activity deleted successfully"));
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
});



// Mark Activity as Completed
at.completedActivity = asyncHandler(async (req, res) => {
  try {
    const { activityId } = req.params;

    const existingActivity = await Activity.findById(activityId);
    if (!existingActivity) {
      return res.status(404).json(new ApiError(404, "Activity not found"));
    }

    if (existingActivity.status === "Completed") {
      return res.status(400).json(new ApiError(400, "Activity is already completed"));
    }

    existingActivity.status = "Completed";
    await existingActivity.save();

    res.status(200).json(new ApiResponse(200, existingActivity, "Activity marked as completed"));
  } catch (error) {
    console.error("Error marking activity as completed:", error);
    res.status(500).json(new ApiError(500, error.message, "Internal server error"));
  }
});

export default at;