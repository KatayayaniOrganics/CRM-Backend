const express = require('express');
const router = express.Router();
const { signup, login, forgotPasswordController,resetPasswordController , verifyOtpController,logout} = require('../controllers/authController');

// Define your API routes

router.post('/signup', signup);

router.post('/login', login);

// router.post('/reset-password/:token', resetpassword);
// Forgot Password route
router.post('/forgot-password', forgotPasswordController);

// Verify OTP route
router.post('/verify-otp', verifyOtpController);

// Reset Password route
router.post('/reset-password', resetPasswordController);


module.exports = router;
