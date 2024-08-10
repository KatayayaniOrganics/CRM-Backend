var express = require('express');
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

router.get('/createtask',createTask);

module.exports = router;
 