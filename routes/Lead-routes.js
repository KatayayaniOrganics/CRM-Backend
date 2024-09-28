var express = require('express');
const { createLead, searchLead ,allLeads, 
    updateLead ,deleteLead,kylasLead,interactLead,assignLead,updateLeadStatus } = require('../controllers/LeadControllers');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

var router = express.Router();

//all Leads
router.get('/all',verifyToken,allLeads);

//all Leads
router.get('/all/:leadId',verifyToken,allLeads);

 //create lead
 router.post('/create',verifyToken,createLead);

//search lead
router.get('/search',verifyToken,searchLead);
  
//Update leads
router.put("/:leadId",verifyToken,updateLead);

//delete leads
router.delete("/:leadId",verifyToken,deleteLead);

//kylas assign lead
router.post("/kylas-assign-lead", kylasLead);

//interact lead
router.post("/interact-lead", interactLead);


// Route to update lead status
router.post('/update-lead-status', verifyToken,updateLeadStatus);

module.exports = router;

