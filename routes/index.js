var express = require('express');
const { createLead, searchLead ,allLeads, updateLead ,deleteLead,kylasLead,interactLead } = require('../controllers/LeadControllers');
const {createSource,createTags,queryCreation,CropsCreation,searchCrop, getAlluserRoles, createRole,updateUserRole, updateCrop, deleteCrop, allCrops, createDisease, searchDisease, updateDisease, allDisease, deleteDisease,getQuery,deleteQuery,updateQuery}=require('../controllers/indexControllers');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');
const {CallDetailsCreation, CallUpdate, CallDelete, callFilter, getAllCalls} = require('../controllers/CallController');

var router = express.Router();

 //create lead
 router.post('/createLead',verifyToken,createLead);

//search lead
router.get('/searchLead',verifyToken,searchLead);

//all Leads
router.get('/getLeads',verifyToken,allLeads);
  
//Update leads
router.put("/updateLead/:leadId",verifyToken,updateLead);

//delete leads
router.delete("/deleteLead/:leadId", deleteLead);


router.post("/kylas-assign-lead", kylasLead);


router.post("/interact-lead", interactLead);

// Create a new queries
router.post('/queries', queryCreation);

router.get('/getqueries', getQuery);

router.delete('/deletequeries', deleteQuery);

router.put('/updatequeries', updateQuery);

// Create a new call detail
router.post('/calls',CallDetailsCreation );

//all calls 
router.get('/getCalls', getAllCalls);

//update calls
router.put('/calls/:callId', CallUpdate);

//delete calls
router.delete('/calls/:callId', CallDelete);

//Filter Calls
router.get("/callFilter",callFilter);

// Create a new crop
router.post('/crops',CropsCreation );

//all Leads
router.get('/getCrops',verifyToken,allCrops);

//search crop
router.get('/searchCrops',verifyToken,searchCrop);

//Update Crop
router.put("/updateCrop/:cropId",verifyToken,updateCrop);

//Delete Crop
router.delete("/deleteCrop/:cropId", deleteCrop);

// Create a new disease
router.post('/disease',createDisease);

//all Disease
router.get('/getDisease',allDisease);

//Search disease
router.get('/searchDisease',searchDisease);

//Update Disease
router.put("/updateDisease/:diseaseId",verifyToken,updateDisease);

//Delete Disease
router.delete("/deleteDisease/:diseaseId", deleteDisease);

// Create a new source
router.post('/sources',createSource);

// Create a new tag
router.post('/tags', createTags);


// Define the route for creating roles
router.post('/userRoles', verifyToken, restrictTo(['Super Admin','Admin']), createRole);

//All user Roles
router.get('/userRoles',getAlluserRoles);


router.put('/update-role', updateUserRole);




module.exports = router;

