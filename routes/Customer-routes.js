const express = require('express');
var router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {createCustomer,allCustomer,searchCustomer,deleteCustomer,updateCustomer} = require('../controllers/customerController');
const { logRequest } = require('../middlewares/logDetails');

router.post('/create',logRequest,createCustomer); 

router.get('/all',logRequest,allCustomer);

router.get('/all/:customerId',logRequest,allCustomer);

router.get('/search',logRequest,searchCustomer);

router.delete('/delete/:customerId',logRequest,deleteCustomer);

router.put('/update/:customerId',logRequest,verifyToken,updateCustomer);

module.exports = router;