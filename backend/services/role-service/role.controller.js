import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { UserRole } from "../../models/role.model.js";

const rc = {}

// Helper to check permissions
const hasPermission = (user) => {
  if (!user) return false;
  const allowedRoles = ["admin", "projectmanager"];
  const userRoles = user.userRoles || [];
  // Also check single role for backward compatibility
  if (user.userRole) userRoles.push(user.userRole);
  
  return userRoles.some(r => allowedRoles.includes(r.name));
};

// create role
rc.createRole = asyncHandler(async (req, res) => {
  console.log("req.body", req.body);
  
  if (!hasPermission(req.user)) {
      return res.status(403).json(new ApiError(403, "Forbidden: Only Admin or Project Manager can create roles"));
  }

  const { name, active } = req.body;
  
  const requiredFields = { name, active };
    
  const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field] || requiredFields[field] === 'undefined');
    
  if (missingFields.length > 0) {
    return res.status(400).json(new ApiError(400, `Missing required field: ${missingFields.join(', ')}`));
  }
  
  const createdRole = await UserRole.create({
    name,
    active
  });
  
  return res.status(201).json(new ApiResponse(201, createdRole, "Role created successfully"));
  
});


//update role
rc.updateRole = asyncHandler(async (req, res) => {
  console.log("Req.body", req.body);

  if (!hasPermission(req.user)) {
      return res.status(403).json(new ApiError(403, "Forbidden: Only Admin or Project Manager can update roles"));
  }

  if (req.params.roleId =="undefined" || !req.params.roleId) {
    return res.status(400).json(new ApiError(400, "id not provided"));
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json(new ApiError(400, "No data provided to update"))
  }

  const { name, active } = req.body;
  
  const updatedRole = await UserRole.findByIdAndUpdate(
    req.params.roleId,
    {
      $set: {
        name,
        active
      },
    },
    { new: true }
  );

  if (!updatedRole) {
    return res.status(404).json(new ApiError(404, "Role not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRole, "Role updated successfully"));

});


// Get role by id
rc.getRoleById = asyncHandler(async (req, res) => {

  if (req.params.roleId =="undefined" || !req.params.roleId) {
    return res.status(400).json(new ApiError(400, "id not provided"));
  }
  
  const role = await UserRole.findById(req.params.roleId);
  
  if (!role) {
    return res.status(404).json(new ApiError(404, "Role not found"));
  }
  
  return res.status(200).json(new ApiResponse(200, role, "Role fetched successfully"));
  
});


// Get all role (Admin sees all, others see active)
rc.getAllRole = asyncHandler(async (req, res) => {
  let query = { active: true };
  if (hasPermission(req.user)) {
      query = {}; // Admin/PM see all
  }

  const role = await UserRole.find(query)
  .sort({ _id : -1 });
  
  return res.status(200).json(new ApiResponse(200, role, "Role fetched successfully"));
  
});



export default rc