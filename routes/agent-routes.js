const express = require('express');
const router = express.Router();
const { verifyToken,restrictTo, verifyRefreshToken } = require('../middlewares/authMiddleware');
const { signup, login, updateAgent,forgotPasswordController,resetPasswordController , 
    verifyOtpController,logout, refreshToken, getAllAgents, searchAgents} = require('../controllers/agentControllers');
const { logRequest } = require('../middlewares/logDetails');

//getAll agents
router.get('/all',logRequest,verifyToken,getAllAgents);

// Define your API routes
router.post('/signup',logRequest,verifyToken ,restrictTo(['Super Admin', 'Admin']),signup);

//login route
router.post('/login',logRequest,login);

// Forgot Password route
router.post('/forgot-password',logRequest,forgotPasswordController);

// Verify OTP route
router.post('/verify-otp',logRequest ,verifyOtpController);

// Reset Password route
router.post('/reset-password', logRequest,resetPasswordController);

//Logout Route
router.post('/logout',logRequest,logout);

//update
router.put('/:agentId', logRequest,verifyToken,restrictTo(['Super Admin', 'Admin']), updateAgent);

//search agent 
router.get('/search', logRequest,verifyToken, searchAgents);

// Token refresh route
router.post("/refresh-token",logRequest,verifyRefreshToken, refreshToken);

module.exports = router;
