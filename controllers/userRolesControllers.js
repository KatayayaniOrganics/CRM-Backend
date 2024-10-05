const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const UserRoles = require("../Models/userRolesModel");
const Agent = require("../Models/agentModel");
    



// Role creation logic, controlled by Super Admin or Admin
exports.createRole = catchAsyncErrors(async (req, res) => {
  logger.info(`Creating new role from IP: ${req.ip}`);
    const { role_name } = req.body;
  
    const agent = await Agent.findById(req.user.id)
    if (agent.user_role) {
      const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
      agent.user_role = userRole;  // Replace with the populated user role
    }
  
      // Check if the user is an Admin and trying to create a Super Admin role
      if (agent.user_role.role_name === "Admin" && role_name === "Super Admin") {
        return res.status(403).json({
          success: false,
          message: "Admins are not allowed to create the Super Admin role"
        });
      }
  
      // If Super Admin, prevent creating another Super Admin
      if (agent.user_role.role_name === "Super Admin" && role_name === "Super Admin") {
        const existingSuperAdmin = await UserRoles.findOne({ role_name: "Super Admin" });
        if (existingSuperAdmin) {
          return res.status(400).json({ success: false, message: "Super Admin role already exists" });
        }
      }
    const lastUserRoles = await UserRoles.findOne().sort({ UserRoleId: -1 }).exec();
  
    let newUserRoleId = "USR-1000"; // Default starting ID
   
    if (lastUserRoles) {
      // Extract the numeric part from the last leadId and increment it
      const lastUserRolesNumber = parseInt(lastUserRoles.UserRoleId.split("-")[1]);
      newUserRoleId = `USR-${lastUserRolesNumber + 1}`;
    }
    // Create a new role
    const newRole = new UserRoles({
      role_name,
      UserRoleId:newUserRoleId
    });
  
    await newRole.save();
  
    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole
    });
  });
  
exports.getAlluserRoles = catchAsyncErrors(async (req, res) => {
    
    const userRoles = await UserRoles.find();
    res.status(200).json(userRoles);
  
  });
  
exports.updateUserRole = catchAsyncErrors(async (req, res) => {
    const { agentId, newRoleId } = req.body;
  
    // Find the new role
    const newRole = await UserRoles.findById(newRoleId);
    if (!newRole) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
  
    // Find the agent and update the user_role
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      {
        user_role: newRole._id,
      },
      { new: true }
    ); // `new: true` returns the updated agent
  
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }
  
    res
      .status(200)
      .json({ success: true, message: "User role updated successfully", agent });
  });
  