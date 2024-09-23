const express = require('express');
var router = express.Router();
const {CallDetailsCreation, CallUpdate, CallDelete, callsearch, getAllCalls} = require('../controllers/CallControllers');
const { verifyToken } = require('../middlewares/authMiddleware');

// Create a new call detail
router.post('/',CallDetailsCreation );

//all calls 
router.get('/all', getAllCalls);

//search Calls
router.get("/search",callsearch);

//update calls
router.put('/:callId',verifyToken, CallUpdate);

//delete calls
router.delete('/:callId', CallDelete);



module.exports = router;