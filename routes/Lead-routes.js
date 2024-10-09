var express = require('express');
const { createLead, searchLead ,allLeads, 
    updateLead ,deleteLead,kylasLead,interactLead,assignLead,updateLeadStatus } = require('../controllers/LeadControllers');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');
const { logRequest } = require('../middlewares/logDetails');

var router = express.Router();

//all Leads
router.get('/all',logRequest,verifyToken,allLeads);

//all Leads
router.get('/all/:leadId',logRequest,verifyToken,allLeads);

 //create lead
 router.post('/create',logRequest,verifyToken,createLead);

//search lead
router.get('/search',logRequest,verifyToken,searchLead);
  
//update leads
router.put("/:leadId([a-zA-Z0-9,-]+)", logRequest, verifyToken, updateLead);


//delete leads
router.delete("/:leadId",logRequest,verifyToken,deleteLead);

//kylas assign lead
router.post("/kylas-assign-lead",logRequest, kylasLead);

//interact lead
router.post("/interact-lead",logRequest, interactLead);

// Route to update lead status
router.patch('/update-callstatus',logRequest, verifyToken,updateLeadStatus);

module.exports = router;

