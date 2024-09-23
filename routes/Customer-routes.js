const express = require('express');
var router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {createCustomer,allCustomer} = require('../controllers/customerController');

router.post('/create',createCustomer); 

router.get('/all',allCustomer);

router.get('/all/:customerId',allCustomer);

module.exports = router;