var express = require('express');
const { createLead, createSource, createTags } = require('../controllers/LeadControllers');
var router = express.Router();


router.get('/', function(req, res) {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.post('/createLead',createLead);

// Create a new source
router.post('/sources',createSource);

// Create a new tag
app.post('/tags', createTags);

router.get('/forgot-password', (req,res)=>{
  res.render('forgotpassword');
});

router.get('/reset-password', (req,res)=>{
   res.render('resetpassword');
})



module.exports = router;
 