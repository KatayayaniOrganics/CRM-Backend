const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../routes/users');
const sendResetEmail = require('./sendMail');



exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create new user
    user = new User({ email, password });

    // Hash the password before saving the user
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    
    res.status(201).json({ success: true, message: 'User registered successfully' });
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
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Forgot Password functionality
exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  console.log('Received email for forgot password:', email);

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    console.log('User found:', user); // Debugging line

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Generate a reset token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
