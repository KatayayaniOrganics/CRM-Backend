var express = require('express');
var router = express.Router();
const { signup, login } = require('../controllers/auth');

// Define your routes
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', signup);
router.post('/login', login);

router.post('/api/auth/signup', signup);
router.post('/api/auth/login', login);

module.exports = router;
