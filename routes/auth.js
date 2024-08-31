const express = require('express');
const router = express.Router();
const { signup, login, forgotPasswordController,resetPasswordController , verifyOtpController,logout, refreshToken} = require('../controllers/authController');

// Define your API routes
router.post('/signup', signup);

//login route
router.post('/login', login);

// Forgot Password route
router.post('/forgot-password', forgotPasswordController);

// Verify OTP route
router.post('/verify-otp', verifyOtpController);

// Reset Password route
router.post('/reset-password', resetPasswordController);

//Logout Route
router.post('/logout', logout);

// Token refresh route
router.post("/refresh-token", refreshToken);


module.exports = router;
