const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendResetEmail = require('./sendMail');
const Agent = require("../Models/agentModel");



exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
  
    let agent = await Agent.findOne({ email });
    if (agent) {
      return res.status(400).json({ success: false, message: 'Agent already exists' });
    }


    agent = await new Agent(req.body);

    // Hash the password before saving the agent
    const salt = await bcrypt.genSalt(10);
    agent.password = await bcrypt.hash(password, salt);

    await agent.save();
    
    res.status(201).json({ success: true, message: 'Agent registered successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Login Functionality
exports.login = async (req, res) => {
  // Authenticate agent
  const agent = await Agent.findOne({ email: req.body.email });
  if (!agent || !(await bcrypt.compare(req.body.password, agent.password))) {
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  } 

  const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  if (token) {
      // Store the token for future use
      res.cookie("token",token)
      console.log('Login successful. Token stored.');
  } else {
      console.log('Login failed. No token received.');
  }
  res.status(200).json({ success: true, token });
};


// Forgot Password functionality
exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  console.log('Received email for forgot password:', email);

  try {
    // Check if the agent exists
    const agent = await Agent.findOne({ email });
    console.log('Agent found:', agent); // Debugging line

    if (!agent) {
      console.log('Agent not found');
      return res.status(400).json({ success: false, message: 'Agent not found' });
    }

    // Generate a reset token
    const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the reset email
    await sendResetEmail(email, token);
    console.log('Reset email sent successfully');
    res.status(200).json({ success: true, message: 'Reset email sent successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};




// Reset Password functionality

exports.resetpassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agent = await Agent.findById(decoded.id);

    if (!agent) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('New Hashed Password:', hashedPassword); 

    agent.password = hashedPassword;
    await agent.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

