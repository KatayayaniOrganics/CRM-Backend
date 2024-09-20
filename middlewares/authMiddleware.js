const jwt = require("jsonwebtoken");
const Agent = require("../models/agentModel");
const UserRoles = require("../models/userRolesModel")

 const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = decoded;
      next();
      
    });
  };
  
  
  // Middleware to restrict access based on user role
  const restrictTo = (roles) => async (req, res, next) => {
    const agent = await Agent.findById(req.user.id)
    if (agent.user_role) {
      const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
      agent.user_role = userRole;  // Replace with the populated user role
    }

    if (!roles.includes(agent.user_role.role_name)) {
      return res.status(403).json({ success: false, message: "Access Denied, Insufficient Privileges" });
    }
    next();
  };
  
  module.exports = { verifyToken, restrictTo };
  