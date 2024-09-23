const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/authMiddleware');
const { createRole, getAlluserRoles, updateUserRole } = require('../controllers/userRolesControllers');

// Define the route for creating roles
router.post('/create', verifyToken, restrictTo(['Super Admin','Admin']), createRole);

//All user Roles
router.get('/all',getAlluserRoles);

//update user Roles
router.put('/:roleId', verifyToken, restrictTo(['Super Admin','Admin']),updateUserRole);


module.exports = router;
