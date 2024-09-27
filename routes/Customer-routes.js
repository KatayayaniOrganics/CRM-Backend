const express = require('express');
var router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {createCustomer,allCustomer,searchCustomer,deleteCustomer,updateCustomer} = require('../controllers/customerController');

router.post('/create',createCustomer); 

router.get('/all',allCustomer);

router.get('/all/:customerId',allCustomer);

router.get('/search',searchCustomer);

router.delete('/delete/:customerId',deleteCustomer);

router.put('/update/:customerId',verifyToken,updateCustomer);

module.exports = router;