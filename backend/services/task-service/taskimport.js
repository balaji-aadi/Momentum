import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Task } from "../../models/task.model.js";
import { ApiError } from "../../utils/ApiError.js";
import csv from "csvtojson";
import { Project } from "../../models/project.model.js";
import { User } from "../../models/user.model.js";
import { Milestone } from "../../models/milestone.model.js";

function validateFieldValue(field, value) {
  switch (field) {
    case "projectName":
    case "taskName":
    case "taskPriority":
    case "taskType":
    case "assignee":
      if (typeof value !== "string" || value.trim() === "") {
        return `${field} is required and must be a valid string.`;
      }
      break;

    case "taskStartDate":
    case "taskDueDate":
      if (!value) {
        return `${field} is required.`;
      }

      if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [day, month, year] = value.split("-");
        value = `${year}-${month}-${day}T00:00:00.000Z`;
      }

      if (isNaN(Date.parse(value))) {
        return `Invalid date format for ${field}. Expected DD-MM-YYYY or ISO 8601 (YYYY-MM-DDTHH:mm:ss.SSSZ).`;
      }
      break;

    case "estimatedHours":
      if (isNaN(value) || Number(value) <= 0) {
        return `Invalid number format for ${field}. Expected a positive number.`;
      }
      break;

    default:
      break;
  }
  return null;
}

const taskImports = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.path) {
    return res
      .status(400)
      .json(new ApiError(400, "Please upload a valid file"));
  }

  try {
    const taskData = await csv().fromFile(req.file.path);
    if (!taskData.length) {
      return res
        .status(400)
        .json(new ApiError(400, "CSV file is empty or invalid"));
    }

    const errors = [];
    const tasksToInsert = [];

    for (const [index, task] of taskData.entries()) {
      const rowErrors = [];

      console.log("task", task)

      const requiredFields = [
        "projectName",
        "taskName",
        "taskPriority",
        "taskType",
        "estimatedHours",
        "assignee",
        "taskStartDate",
        "taskDueDate",
      ];
      requiredFields.forEach((field) => {
        if (!task[field]) rowErrors.push(`${field} is required`);
      });

      Object.keys(task).forEach((field) => {
        const errorMessage = validateFieldValue(field, task[field]);
        if (errorMessage) rowErrors.push(errorMessage);
      });

      const collation = { locale: "en", strength: 2 } // Case-insensitive


      const project = await Project.findOne({ name: task.projectName }).collation(collation);
      if (!project) {
        rowErrors.push(`Project "${task.projectName}" not found`);
      }

      const milestone = await Milestone.findOne({ milestoneName: task.milestone }).collation(collation);

      const assignee = await User.findOne({ firstName: task.assignee }).collation(collation);
      if (!assignee) {
        rowErrors.push(`Assignee "${task.assignee}" not found`);
      }

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split("-");
          return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        }
        return new Date(dateStr);
      };

      const taskStartDate = parseDate(task.taskStartDate);
      const taskDueDate = parseDate(task.taskDueDate);

      if (isNaN(taskStartDate) || isNaN(taskDueDate)) {
        rowErrors.push("Invalid date format. Expected YYYY-MM-DD or ISO 8601.");
      }

      // if (project) {
      //   const existingTask = await Task.findOne({
      //     projectName: project._id,
      //     taskDescription: task.taskDescription?.trim(),
      //     milestone: milestone?._id || null,
      //   }).collation({ locale: "en", strength: 2 });

      //   if (existingTask) {
      //     rowErrors.push("Duplicate task. A task with the same description, project, and milestone already exists.");
      //   }
      // }


      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
        continue;
      }

      tasksToInsert.push({
        projectName: project._id,
        taskName: task.taskName,
        milestone: milestone?._id,
        taskPriority: task.taskPriority,
        taskType: task.taskType,
        estimatedHours: Number(task.estimatedHours),
        taskDescription: task.taskDescription || "",
        attachments: task.attachments ? task.attachments.split(",") : [],
        assignee: assignee._id,
        taskStartDate: taskStartDate,
        taskDueDate: taskDueDate,
        additionalNotes: task.additionalNotes || "",
        dependentTasks: task.dependentTasks ? task.dependentTasks.split(",") : [],
        dependencyType: task.dependencyType || "start-to-start",
        status: task.status || "todo",
      });
    }

    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ message: "Validation errors in CSV file.", errors });
    }

    const insertedTasks = await Task.insertMany(tasksToInsert);

    fs.unlinkSync(req.file.path);
    return res
      .status(201)
      .json({ message: "Tasks imported successfully!", tasks: insertedTasks });
  } catch (error) {
    console.error("Error processing file:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Invalid file format or mismatched data."));
  }
});



export default taskImports;
