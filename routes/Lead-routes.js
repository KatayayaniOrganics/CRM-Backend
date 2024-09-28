var express = require('express');
const { createLead, searchLead ,allLeads, updateLead ,deleteLead,kylasLead,interactLead } = require('../controllers/LeadControllers');
const { verifyToken,restrictTo } = require('../middlewares/authMiddleware');

var router = express.Router();

 //create lead
 router.post('/',verifyToken,createLead);

//search lead
router.get('/search',verifyToken,searchLead);

//all Leads
router.get('/all',verifyToken,allLeads);
  
//Update leads
router.put("/:leadId",verifyToken,updateLead);

//delete leads
router.delete("/:leadId", deleteLead);

//kylas assign lead
router.post("/kylas-assign-lead", kylasLead);

//interact lead
router.post("/interact-lead", interactLead);


module.exports = router;

