import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Project } from "../../../models/project.model.js";
import { Task } from "../../../models/task.model.js";
import { User } from "../../../models/user.model.js"
import { UserRole } from "../../../models/role.model.js";

const mdboard = {};

///////////////////////////////////////////////////-------------- Manager's Dashboard ------------////////////////////////////////////////////////////////
// ...
mdboard.projectStatistics = asyncHandler(async (req, res) => {
    // ...
    const projects = await Project.find().populate(
        "teamMembers",
        "firstName lastName email userRole userRoles phoneNumber profileImage address"
    ).populate({
        path: "teamMembers",
        populate: { path: "userRoles", select: "name" }
    });
    // ...
            const assignedTeamMembers = (project.teamMembers || [])
                .filter(member => member && member.firstName && member.lastName)
                .map(member => {
                    totalMembers.add(member.email);
                    return {
                        firstName: member.firstName,
                        lastName: member.lastName,
                        email: member.email,
                        userRole: member.userRole, // keep for compatibility
                        userRoles: member.userRoles,
                        phoneNumber: member.phoneNumber,
                        profileImage: member.profileImage,
                        address: member.address
                    };
                });
    // ...
});

mdboard.teamStatistics = asyncHandler(async (req, res) => {
    // ...
    const users = await User.find()
        .populate("firstName lastName email userRole userRoles phoneNumber profileImage address")
        .populate("userRoles");

    // ...
            return {
                name: `${user.firstName} ${user.lastName || ""}`.trim(),
                role: user.userRoles?.map(r => r.name).join(", ") || user.userRole?.name,
                // ...
            };
    // ...
});


mdboard.userStatistics = asyncHandler(async (req, res) => {
    // ...
    const userRole = await UserRole.findOne({ name: "projectmanager" });
    // Count users who do NOT have the projectmanager role in their roles array
    const teamMembers = await User.countDocuments({ userRoles: { $nin: [userRole?._id] } });
    // ...
});


mdboard.todayTaskDeliverables = asyncHandler(async (req, res) => {
    // ...
    const users = await User.find().populate("userRole").populate("userRoles");
    // ...
            return {
                name: `${user.firstName} ${user.lastName || ""}`.trim(),
                role: user.userRoles?.map(r => r.name).join(", ") || user.userRole?.name,
                // ...
            };
    // ...
});


mdboard.developerStatistics = asyncHandler(async (req, res) => {
    try {
        const userRoles = req.user?.userRoles || [];
        // Fallback to userRole if userRoles empty (though auth middleware should populate it)
        if (userRoles.length === 0 && req.user?.userRole) {
            userRoles.push(req.user.userRole);
        }

        const userId = req.user?._id;

        const allowedRoles = ["developer", "tester", "admin", "projectmanager"];
        const hasAccess = userRoles.some(r => allowedRoles.includes(r.name));

        let user;
        let userIds;

        if (hasAccess) {
            user = await User.findById(userId)
                .select("firstName lastName email userRole userRoles phoneNumber profileImage address")
                .populate("userRole")
                .populate("userRoles");

            userIds = [userId];
        } else {
            return res.status(403).json(new ApiError(403, "Forbidden", "Access Denied"));
        }
        // ...
        const data = {
            name: `${user.firstName} ${user.lastName || ""}`.trim(),
            role: user.userRoles?.map(r => r.name).join(", ") || user.userRole?.name,
            // ...
        };

        res.status(200).json(new ApiResponse(200, data, "Statistics fetched successfully"));

    } catch (error) {
        // ...
    }
});


export default mdboard