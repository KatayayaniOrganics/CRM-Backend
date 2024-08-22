const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Agent = require("../Models/agentModel"); // Make sure this is the correct path
const sendResetEmail = require("../controllers/sendMail");

// Signup Controller
exports.signup = async (req, res) => {
  const { firstname, lastname, email, password, address } = req.body;

  try {
    // Check if the agent already exists
    let agent = await Agent.findOne({ email });
    if (agent) {
      return res.status(400).json({ success: false, message: 'Agent already exists' });
    }

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
    
    res.status(201).json({ success: true, message: 'Agent registered successfully' });
  } catch (error) {
    console.error("Error in signup:", error); // Detailed error logging
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
    if (!agent || !(await bcrypt.compare(password, agent.password))) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    } 

    const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Store the token in cookies
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Forgot Password Controller
module.exports.forgotPasswordController = async (req, res) => {
  try {
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

  } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).send({ error: 'An error occurred while sending the OTP' });
  }
};

// OTP Verification Controller
module.exports.verifyOtpController = async (req, res) => {
  try {
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

  } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).send({ error: 'An error occurred while verifying OTP' });
  }
};

// Reset Password Controller
module.exports.resetPasswordController = async (req, res) => {
  try {
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

  } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).send({ error: 'An error occurred while resetting the password' });
  }
};
