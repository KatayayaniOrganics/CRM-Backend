const express = require('express');
var router = express.Router();
const { queryCreation, getQuery, deleteQuery, updateQuery, searchQuery } = require('../controllers/queryControllers');
const { logRequest } = require('../middlewares/logDetails');

// Create a new queries
router.post('/create',logRequest, queryCreation);

//get queries
router.get('/all',logRequest, getQuery);

//one queries
router.get('/all/:queryId',logRequest, searchQuery);

//update queries
router.put('/:queryId',logRequest, updateQuery);

//delete queries
router.delete('/:queryId',logRequest, deleteQuery);



module.exports = router;

