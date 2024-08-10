var express = require('express');
const Lead = require('../Models/leadModel');
const { createLead } = require('../controllers/LeadControllers');
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


module.exports = router;
 