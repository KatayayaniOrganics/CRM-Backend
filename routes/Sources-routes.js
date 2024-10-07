const {createSource} = require('../controllers/sourcesControllers');                    
const express = require('express');
const router = express.Router();
const { logRequest } = require('../middlewares/logDetails');

// Create a new source
router.post('/create',logRequest,createSource);

module.exports = router;