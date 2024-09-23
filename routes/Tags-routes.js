const express = require('express');
const router = express.Router();
const { createTags } = require('../controllers/tagsControllers');

// Create a new tag
router.post('/create', createTags);

module.exports = router;
