const express = require('express');
const router = express.Router();
const { signup, login, forgotpassword,resetpassword} = require('../controllers/authController');

// Define your API routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotpassword); 
// router.post('/forgot-password', (req, res, next) => {
//     console.log('Forgot Password route hit');
//     next();
// }, forgotpassword);

router.post('/reset-password/:token', resetpassword);



module.exports = router;
