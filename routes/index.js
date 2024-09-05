var express = require('express');
const { createLead, searchLead ,allLeads, updateLead ,deleteLead,kylasLead } = require('../controllers/LeadControllers');
const {createSource,createTags,queryCreation,CropsCreation,searchCrop}=require('../controllers/indexControllers');
const { verifyToken } = require('../middlewares/authMiddleware');
const {CallDetailsCreation, CallUpdate, CallDelete} = require('../controllers/CallController');
const { checkTokenExpiration } = require('../middlewares/refreshMiddleware');


var router = express.Router();


 //create lead
 router.post('/createLead',verifyToken,createLead);

//search lead
router.get('/searchLead',verifyToken,searchLead);

//all Leads
router.get('/getLeads',verifyToken,allLeads);
  
//Update leads
router.put("/updateLead/:leadId",updateLead);

//delete leads
router.delete("/deleteLead/:leadId", deleteLead);


router.post("/kylas-assign-lead", kylasLead);

// Create a new query
router.post('/queries', queryCreation);

// Create a new call detail
router.post('/calls',CallDetailsCreation );

//update calls
router.put('/calls/:callId', CallUpdate);

//delete calls
router.delete('/calls/:callId', CallDelete)

// Create a new crop
router.post('/crops',CropsCreation );

//search crop
router.get('/searchCrops',verifyToken,searchCrop);

// Create a new source
router.post('/sources',createSource);

// Create a new tag
router.post('/tags', createTags);


module.exports = router;
 
