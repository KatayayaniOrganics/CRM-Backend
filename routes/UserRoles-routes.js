const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/authMiddleware');
const { logRequest } = require('../middlewares/logDetails');
const { createRole, getAlluserRoles, updateUserRole } = require('../controllers/userRolesControllers');


// Define the route for creating roles with logging
router.post('/create', logRequest, verifyToken, restrictTo(['Super Admin', 'Admin']), createRole);

// All user Roles with logging
router.get('/all', logRequest, getAlluserRoles);

// Update user Roles with logging
router.put('/:roleId', logRequest, verifyToken, restrictTo(['Super Admin', 'Admin']), updateUserRole);

module.exports = router;
