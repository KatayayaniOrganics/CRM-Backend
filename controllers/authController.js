const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Agent = require("../Models/agentModel"); // Make sure this is the correct path
const sendResetEmail = require("../controllers/sendMail");
const logger = require('../logger');
const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');

// Signup Controller
exports.signup = catchAsyncErrors(async (req, res) => {
  const { firstname, lastname, email, password, address } = req.body;
  logger.info("You made a POST Request on Singup Route");

  // Create a new agent
  agent = new Agent({
    firstname,
    lastname,
    email,
    password,
    address
  });

  // Hash the password before saving
  const salt = await bcrypt.genSalt(10);
  agent.password = await bcrypt.hash(password, salt);

  // Save the agent to the database
  await agent.save();
  
  logger.info({message: 'Agent Signup successfully'});
  
  res.status(201).json({ success: true, message: 'Agent registered successfully' });

});


// Login Controller
exports.login = catchAsyncErrors(async (req, res, next) => {
    logger.info("You made a POST Request on Login Route");
    
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
  
    if (!agent) {
      return next(new ErrorHandler("Student Not Found With This Email Address", 404));
    }
  
    // Log the agent password to check if it exists
    logger.info(`Agent found with email ${email}, password exists: ${!!agent.password}`);
  
    if (!(await bcrypt.compare(password, agent.password))) {
      return res.status(404).json({ success: false, message: 'Invalid credentials' });
    }
  
    // Log to check if the JWT_SECRET is defined
    logger.info(`JWT_SECRET is defined: ${!!process.env.JWT_SECRET}`);
  
    const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
    // Store the token in cookies
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ success: true, token, message: 'Agent Logged successfully' });
    
    logger.info({ message: 'Agent Logged successfully', token: token });
  });
  
// Forgot Password Controller
exports.forgotPasswordController = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Forget Route")
      const { email } = req.body;

      if (!email) {
          return res.status(400).send({ error: 'Email is required' });
      }

      const user = await Agent.findOne({ email }); // Changed from agentModel to Agent
      if (!user) {
          return res.status(404).send({ error: 'User not found' });
      }

      // Generate OTP and expiration time
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirationTime = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Save OTP and expiration time to user document
      user.otp = otp;
      user.otpExpirationTime = otpExpirationTime;
      await user.save();

      // Send OTP via email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: process.env.EMAIL_USER, // Changed from EMAIL to EMAIL_USER
          to: user.email,
          subject: 'Your Password Reset OTP',
          text: `Your OTP for password reset is: ${otp}` // Fixed template string
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).send({ message: 'OTP sent successfully' });

 
});

// OTP Verification Controller
exports.verifyOtpController = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Verify Otp Route")


      const { email, otp } = req.body;

      if (!email || !otp) {
          return res.status(400).send({ error: 'Email and OTP are required' });
      }

      const user = await Agent.findOne({ email }); // Changed from agentModel to Agent
      if (!user) {
          return res.status(404).send({ error: 'User not found' });
      }

      // Check if OTP matches
      if (user.otp.toString() !== otp.toString()) {
          return res.status(400).send({ error: 'Invalid OTP' });
      }

      // Check if OTP has expired
      const currentTime = new Date().getTime();
      const otpExpirationTime = new Date(user.otpExpirationTime).getTime();

      if (currentTime > otpExpirationTime) {
          return res.status(400).send({ error: 'OTP has expired' });
      }

      // Set OTP verified flag
      user.otpVerified = true;
      await user.save();

      return res.status(200).send({ message: 'OTP verified successfully' });

  
});

// Reset Password Controller
exports.resetPasswordController = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Reset Route")

      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
          return res.status(400).send({ error: 'Email and new password are required' });
      }

      const user = await Agent.findOne({ email }); // Changed from agentModel to Agent
      if (!user) {
          return res.status(404).send({ error: 'User not found' });
      }

      // Check if OTP was verified
      if (!user.otpVerified) {
          return res.status(400).send({ error: 'OTP not verified. Please verify OTP first.' });
      }

      // Hash the new password and save it
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      user.password = hash;

      // Clear OTP, OTP expiration time, and OTP verified flag
      user.otp = null;
      user.otpExpirationTime = null;
      user.otpVerified = false; // false after verification

      await user.save();

      return res.status(200).send({ message: 'Password reset successfully' });

  
});


module.exports.logout = catchAsyncErrors( async (req, res) => {
        logger.info("You made a POST Request on Logout Route");
      
        // Clear the token from cookies
        res.clearCookie('token', { httpOnly: true });
        
        return res.status(200).json({ success: true, message: 'Logged out successfully!' });
      });
      
