var express = require('express');
var router = express.Router();
const { signup , login} = require('../controllers/auth');
const User = require('./users');




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index'); 
});



router.get('/login', (req, res) => {
  res.render('login');
});


router.get('/signup', (req,res)=>{
  res.render('signup')
})


router.post('/signup', signup);

router.post('/login', login);


router.post('/api/auth/signup', signup); 

router.post('/api/auth/login', login); 

module.exports = router;
