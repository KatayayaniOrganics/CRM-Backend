var express = require('express');
const Lead = require('../Models/leadModel');
const { createLead } = require('../controllers/LeadControllers');
const { createTask } = require('../controllers/task');
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


router.get('/createtask',createTask);


router.get('/forgot-password', (req,res)=>{
  res.render('forgotpassword');
});

router.get('/reset-password', (req,res)=>{
   res.render('resetpassword');
})



module.exports = router;
 