const jwt = require("jsonwebtoken");
const Agent = require("../Models/agentModel");
const UserRoles = require("../Models/userRolesModel")


//verify token
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

//verify refresh token
const verifyRefreshToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not provided" });
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        req.user = decoded; // Store user info for further use
        next();
    });
};

  module.exports = { verifyToken, restrictTo, verifyRefreshToken };
