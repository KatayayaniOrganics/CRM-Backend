const express = require('express');
var router = express.Router();
const { queryCreation, getQuery, deleteQuery, updateQuery, searchQuery } = require('../controllers/queryControllers');

// Create a new queries
router.post('/create', queryCreation);

//get queries
router.get('/all', getQuery);

router.get('/:queryId', searchQuery);

//update queries
router.put('/:queryId', updateQuery);

//delete queries
router.delete('/:queryId', deleteQuery);



module.exports = router;

