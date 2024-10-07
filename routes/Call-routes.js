const express = require('express');
var router = express.Router();
const {CallDetailsCreation, CallUpdate, CallDelete, callsearch, getAllCalls} = require('../controllers/CallControllers');
const { verifyToken } = require('../middlewares/authMiddleware');
const { logRequest } = require('../middlewares/logDetails');

//all calls 
router.get('/all',logRequest,getAllCalls);

// Create a new call detail
router.post('/create',logRequest,CallDetailsCreation );

//search Calls
router.get("/search",logRequest,callsearch);

//update calls
router.put('/:callId',logRequest,verifyToken, CallUpdate);

//delete calls
router.delete('/:callId',logRequest,CallDelete);



module.exports = router;