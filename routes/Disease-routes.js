const express = require('express');
const router = express.Router();
const { createDisease, allDisease, searchDisease, updateDisease, deleteDisease } = require('../controllers/diseaseControllers');
const { verifyToken } = require('../middlewares/authMiddleware');
const { logRequest } = require('../middlewares/logDetails');
// Create a new disease
router.post('/create',logRequest,createDisease);

//all Disease
router.get('/all',logRequest,allDisease);

//all Disease by id
router.get('/all/:diseaseId',logRequest,allDisease);

//Search disease
router.get('/search',logRequest,searchDisease);

//Update Disease
router.put("/:diseaseId",logRequest,verifyToken,updateDisease);

//Delete Disease
router.delete("/:diseaseId",logRequest, deleteDisease);

module.exports = router;
