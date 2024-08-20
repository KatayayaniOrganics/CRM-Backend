const jwt = require("jsonwebtoken")

exports.verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    
    if (!authHeader) {
      return res.status(403).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.user = decoded;
      next();
    });
  };
  
  