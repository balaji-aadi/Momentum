import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { TestCase } from "../../../models/testTask.model.js";
import mongoose from "mongoose";
import { Bug } from "../../../models/bug.model.js";

const tdboard = {};

// Test Statistics
tdboard.testStatistics = asyncHandler(async (req, res) => {
    console.log("Req.body---> ", req.body);
    try {
        const { projectId, assignee } = req.body.filter || {};  
        const userRole = req.user?.userRole;

        let filter = {};
        if (projectId) {
            filter.projectId = new mongoose.Types.ObjectId(projectId);
        }

        if (userRole?.name === "developer" || userRole?.name === "tester") {
            filter.assignee = req.user?._id;
        } else if (assignee && userRole?.name === "projectmanager") {
            filter.assignee = new mongoose.Types.ObjectId(assignee);
        }

        console.log("Final filter:", filter);


        const totalTestCases = await TestCase.find(filter)
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("testCaseName projectId assignee preconditions testScenarioDescription image updatedBy createdBy testSteps");

        const completedTests = await TestCase.find({ ...filter, testStatus: "Pass" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("testCaseName projectId assignee preconditions testScenarioDescription image updatedBy createdBy testSteps");

        const failedTests = await TestCase.find({ ...filter, testStatus: "Fail" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("testCaseName projectId assignee preconditions testScenarioDescription image updatedBy createdBy testSteps");

        const notExecutedTests = await TestCase.find({ ...filter, testStatus: "Not Executed" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("testCaseName projectId assignee preconditions testScenarioDescription image updatedBy createdBy testSteps");

        const testStats = {
            totalTestCases: {
                count: totalTestCases.length,
                testCases: totalTestCases
            },
            completedTests: {
                count: completedTests.length,
                testCases: completedTests
            },
            failedTests: {
                count: failedTests.length,
                testCases: failedTests
            },
            notExecutedTests: {
                count: notExecutedTests.length,
                testCases: notExecutedTests
            }
        };

        return res.status(200).json(new ApiResponse(200, testStats, "Test Statistics fetched successfully"));

    } catch (error) {
        console.error("Error", error);
        return res.status(400).json(new ApiError(400, error.message, "Internal server error"));
    }
});



// Bug Statistics
tdboard.bugStatistics = asyncHandler(async (req, res) => {
    console.log("bug.body---> ", req.body);
    try {
        const { projectId, assignee } = req.body.filter || {};
        const userRole = req.user?.userRole;

        
        let filter = {};
        if (projectId) {
            filter.projectId = new mongoose.Types.ObjectId(projectId);
        }

        if (userRole?.name === "developer" || userRole?.name === "tester") {
            filter.assignee = req.user?._id;
        } else if (assignee && userRole?.name === "projectmanager") {
            filter.assignee = new mongoose.Types.ObjectId(assignee);
        }

        console.log("Final filter:", filter);

        const totalBugs = await Bug.find({ projectId })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("bugTitle bugDescription severity reproducibility stepsToReproduce attachment createdBy updatedBy");


        const openBugs = await Bug.find({ projectId, bugStatus: "Open" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("bugTitle bugDescription severity reproducibility stepsToReproduce attachment createdBy updatedBy");

        const closedBugs = await Bug.find({ projectId, bugStatus: "Closed" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("bugTitle bugDescription severity reproducibility stepsToReproduce attachment createdBy updatedBy");

        const inprogressBugs = await Bug.find({ projectId, bugStatus: "In Progress" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("bugTitle bugDescription severity reproducibility stepsToReproduce attachment createdBy updatedBy");

        const resolvedBugs = await Bug.find({ projectId, bugStatus: "Resolved" })
            .populate("projectId", "projectName")
            .populate("assignee", "name email")
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .select("bugTitle bugDescription severity reproducibility stepsToReproduce attachment createdBy updatedBy");

        const bugStats = {
            totalBugs: {
                count: totalBugs.length,
                bugs: totalBugs
            },
            openBugs: {
                count: openBugs.length,
                bugs: openBugs
            },
            closedBugs: {
                count: closedBugs.length,
                bugs: closedBugs
            },
            inprogressBugs: {
                count: inprogressBugs.length,
                bugs: inprogressBugs
            },
            resolvedBugs: {
                count: resolvedBugs.length,
                bugs: resolvedBugs
            }
        };

        return res.status(200).json(new ApiResponse(200, bugStats, "Bug Statistics fetched successfully"));

    } catch (error) {
        console.error("Error", error);
        return res.status(500).json(new ApiError(500, error.message, "Internal server error"));
    }
});


export default tdboard;