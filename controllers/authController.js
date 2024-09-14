const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Agent = require("../Models/agentModel"); 
const logger = require('../logger');
const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const ErrorHandler  = require('../utils/errorHandler');
const UserRoles = require("../Models/userRolesModel");

//SignUp Controller
exports.signup = catchAsyncErrors(async (req, res) => {
  const { password, user_role } = req.body;
  logger.info("You made a POST Request on Signup Route");

   // Check if attempting to create or update to Super Admin role (USR-1000)
   if (user_role === "USR-1000") {
    // Check if any agent already has the Super Admin role
    const existingSuperAdmin = await Agent.findOne({ user_role: "USR-1000" });
    if (existingSuperAdmin) {
      return res.status(400).json({ success: false, message: "Super Admin (USR-1000) already exists. Cannot create another Super Admin." });
    }
  }

  // Find the latest agent by sorting in descending order
  const lastAgent = await Agent.findOne().sort({ agentId: -1 }).exec();

  let newAgentId = "A0-1000"; // Default starting ID

  if (lastAgent) {
    const lastAgentIdNumber = parseInt(lastAgent.agentId.split("-")[1]);
    newAgentId = `A0-${lastAgentIdNumber + 1}`;
  }

  const agent = new Agent({
    ...req.body,
    agentId: newAgentId,
    user_role
  });

  const salt = await bcrypt.genSalt(10);
  agent.password = await bcrypt.hash(password, salt);

  await agent.save();
  logger.info({ message: 'Agent Signup successfully' });

  res.status(201).json({ success: true, message: 'Agent registered successfully' });
});

// Login Controller
exports.login = catchAsyncErrors(async (req, res, next) => {
    logger.info("You made a POST Request on Login Route");
    
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });

    if (!agent) {
        return next(new ErrorHandler("Agent Not Found With This Email Address", 404));
    }

    if (!(await bcrypt.compare(password, agent.password))) {
        return res.status(404).json({ success: false, message: 'Invalid credentials' });
    }

  
    // Log to check if the JWT_SECRET is defined
    logger.info(`JWT_SECRET is defined: ${!!process.env.JWT_SECRET}`);
  
    const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
    // Store the token in cookies
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ success: true, token, message: 'Agent Logged successfully' });
    
    logger.info({ message: 'Agent LoggedIn successfully', });
});
  
// Forgot Password Controller
exports.forgotPasswordController = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Forget Route")
      const { email } = req.body;

      if (!email) {
          return res.status(400).send({ error: 'Email is required' });
      }


    // Generate the access token and refresh token
    const accessToken = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: agent._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Store the tokens in cookies
    res.cookie("token", accessToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });

    res.status(200).json({ success: true, accessToken, refreshToken, message: 'Agent Logged successfully' });
    logger.info({ message: 'Agent LoggedIn successfully' });
});


exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return next(new ErrorHandler("Refresh Token not provided", 401));
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send the new access token
        res.cookie("token", newAccessToken, { httpOnly: true, secure: true });
        res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        return next(new ErrorHandler("Invalid Refresh Token", 401));
    }
});


// Forgot Password Controller
exports.forgotPasswordController = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Forgot Route");
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).send({ error: 'Email is required' });
    }
  
    const user = await Agent.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
  
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirationTime = Date.now() + 15 * 60 * 1000;
  
    user.otp = otp;
    user.otpExpirationTime = otpExpirationTime;
    await user.save();
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`
    };
  
    await transporter.sendMail(mailOptions);
  
    return res.status(200).send({ message: 'OTP sent successfully' });
  });
  
// OTP Verification Controller
exports.verifyOtpController = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Verify OTP Route");
  
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).send({ error: 'Email and OTP are required' });
    }
  
    const user = await Agent.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
  
    if (user.otp.toString() !== otp.toString()) {
      return res.status(400).send({ error: 'Invalid OTP' });
    }
  
    const currentTime = new Date().getTime();
    const otpExpirationTime = new Date(user.otpExpirationTime).getTime();
  
    if (currentTime > otpExpirationTime) {
      return res.status(400).send({ error: 'OTP has expired' });
    }
  
    user.otpVerified = true;
    await user.save();
  
    return res.status(200).send({ message: 'OTP verified successfully' });
  });
  
// Reset Password Controller
exports.resetPasswordController = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Reset Route");
  
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      return res.status(400).send({ error: 'Email and new password are required' });
    }
  
    const user = await Agent.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
  
    if (!user.otpVerified) {
      return res.status(400).send({ error: 'OTP not verified. Please verify OTP first.' });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
  
    user.otp = null;
    user.otpExpirationTime = null;
    user.otpVerified = false;
  
    await user.save();
  
    return res.status(200).send({ message: 'Password reset successfully' });
  });
  
// Logout Controller
exports.logout = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Logout Route");
  
    res.clearCookie('accessToken', { httpOnly: true });
    res.clearCookie('refreshToken', { httpOnly: true });
  
    return res.status(200).json({ success: true, message: 'Logged out successfully!' });
  });
  
// Refresh Token Controller
exports.refreshToken = catchAsyncErrors(async (req, res) => {
    const { refreshToken } = req.cookies;
  
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }
  
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }
  
        const agent = await Agent.findById(decoded.id);
        if (!agent || agent.refreshToken !== refreshToken) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }
  
        const newAccessToken = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
        res.cookie("accessToken", newAccessToken, { httpOnly: true });
        res.status(200).json({ success: true, accessToken: newAccessToken });
    });
});

//get all Agents
exports.getAllAgents = catchAsyncErrors(async (req, res) => {
  try {
    // Fetch all agents
    const agents = await Agent.find();

    // Manually populate the 'user_role' field using the UserRoleId string
    const populatedAgents = await Promise.all(agents.map(async (agent) => {
      if (agent.user_role) {
        const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
        agent.user_role = userRole;  // Replace with the populated user role
      }
      return agent;
    }));

    return res.status(200).json({
      success: true,
      message: 'All Agents retrieved successfully',
      agents: populatedAgents,  // Return the fetched agents
    });
  } catch (err) {
    // Handle any errors during the process
    return res.status(500).json({ success: false, message: 'Error retrieving agents', error: err.message });
  }
});

//update agent
exports.updateAgent = catchAsyncErrors(async (req, res) => {
  const { agentId } = req.params;
  const updates = req.body;
  

  try {
    // Check if attempting to update the user_role to Super Admin
    if (updates.user_role === "USR-1000") {
      // Check if any other agent already has the Super Admin role
      const existingSuperAdmin = await Agent.findOne({ user_role: "USR-1000", agentId: { $ne: agentId } });
      if (existingSuperAdmin) {
        return res.status(400).json({ success: false, message: "Super Admin role (USR-1000) already exists. Cannot update another agent to Super Admin." });
      }
    }

    // Find agent by agentId and update
    const updatedAgent = await Agent.findOneAndUpdate(
      { agentId: agentId },  // Search by agentId
      updates,               // Apply the updates from the request body
      { new: true, runValidators: true }  // Options: return the updated document and run validators
    );

    // If agent is not found
    if (!updatedAgent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error updating agent", error: err.message });
  }
});
