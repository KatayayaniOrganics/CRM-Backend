const express = require('express');
const router = express.Router();
const { createTags } = require('../controllers/tagsControllers');
const { logRequest } = require('../middlewares/logDetails');
// Create a new tag
router.post('/create',logRequest, createTags);

module.exports = router;
