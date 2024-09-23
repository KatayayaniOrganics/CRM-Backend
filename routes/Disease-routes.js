const express = require('express');
const router = express.Router();
const { createDisease, allDisease, searchDisease, updateDisease, deleteDisease } = require('../controllers/diseaseControllers');
const { verifyToken } = require('../middlewares/authMiddleware');

//all Disease
router.get('/all',allDisease);

// Create a new disease
router.post('/create',createDisease);

//Search disease
router.get('/search',searchDisease);

//Update Disease
router.put("/:diseaseId",verifyToken,updateDisease);

//Delete Disease
router.delete("/:diseaseId", deleteDisease);

module.exports = router;
