const express = require('express');
var router = express.Router();
const { queryCreation, getQuery, deleteQuery, updateQuery } = require('../controllers/queryControllers');

// Create a new queries
router.post('/', queryCreation);

//get queries
router.get('/all', getQuery);

//update queries
router.put('/:queryId', updateQuery);

//delete queries
router.delete('/:queryId', deleteQuery);


module.exports = router;

