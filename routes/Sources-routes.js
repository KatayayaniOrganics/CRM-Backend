const {createSource} = require('../controllers/sourcesControllers');                    
const express = require('express');
const router = express.Router();

// Create a new source
router.post('/create',createSource);

module.exports = router;