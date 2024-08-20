var express = require('express');
const { createLead } = require('../controllers/LeadControllers');

const {createSource,createTags,queryCreation, CallDetailsCreation, CropsCreation}=require('../controllers/indexControllers');
const { verifyToken } = require('../middlewares/authMiddleware');

var router = express.Router();


router.get('/', function(req, res) {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});


router.get('/forgot-password', (req,res)=>{
  res.render('forgotpassword');
});

router.get('/reset-password', (req,res)=>{
   res.render('resetpassword');
});
router.get('/createLead', (req,res)=>{
   res.render('createLead');
});

 //create lead
 router.post('/createLead',verifyToken,createLead);




// Create a new query
router.post('/queries', queryCreation);

// Create a new call detail
router.post('/calls',CallDetailsCreation );


// Create a new crop
router.post('/crops',CropsCreation );


// Create a new source
router.post('/sources',createSource);

// Create a new tag
router.post('/tags', createTags);


router.get("/test",verifyToken,(res,req)=>{
  req.send("wroking");
});

module.exports = router;
 