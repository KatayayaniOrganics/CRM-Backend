const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon } = require('../controllers/couponControllers');
const { logRequest } = require('../middlewares/logDetails');

// Create a new coupon
router.post('/', logRequest, createCoupon);

// Get all coupons
router.get('/all', logRequest, verifyToken, getAllCoupons);

// Get a coupon by custom couponId
router.get('/:couponId', logRequest, verifyToken, getCouponById);  // Adjusted the route

// Update a coupon by custom couponId
router.put('/:couponId', logRequest, verifyToken, updateCoupon);

// Delete a coupon by custom couponId
router.delete('/:couponId', logRequest, deleteCoupon);

module.exports = router;
