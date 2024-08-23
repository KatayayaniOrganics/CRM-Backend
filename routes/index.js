var express = require('express');
const { createLead, updateLead } = require('../controllers/LeadControllers');
const {createSource,createTags,queryCreation, CallDetailsCreation, CropsCreation}=require('../controllers/indexControllers');
const { verifyToken } = require('../middlewares/authMiddleware');

var router = express.Router();


router.get('/', function(req, res) {
  res.render('index');
});


 //create lead
 router.post('/createLead',verifyToken,createLead);
 
 //update Lead
 router.post('/updateLead/:id',verifyToken,updateLead);

// Create a new query
router.post('/queries', verifyToken,queryCreation);

// Create a new call detail
router.post('/calls',verifyToken,CallDetailsCreation );


// Create a new crop
router.post('/crops',verifyToken,CropsCreation );


// Create a new source
router.post('/sources',verifyToken,createSource);

// Create a new tag
router.post('/tags', verifyToken,createTags);



module.exports = router;
 