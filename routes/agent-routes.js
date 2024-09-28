const express = require('express');
const router = express.Router();
const { verifyToken,restrictTo, verifyRefreshToken } = require('../middlewares/authMiddleware');
const { signup, login, updateAgent,forgotPasswordController,resetPasswordController , 
    verifyOtpController,logout, refreshToken, getAllAgents, searchAgents} = require('../controllers/agentControllers');

// Define your API routes
router.post('/signup',verifyToken ,restrictTo(['Super Admin', 'Admin']),signup);

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

//getAll agents
router.get('/all', getAllAgents);

//update
router.put('/:agentId', updateAgent);

//search agent 
router.get('/search', verifyToken, searchAgents);

// Token refresh route
router.post("/refresh-token", verifyRefreshToken, refreshToken);

module.exports = router;
