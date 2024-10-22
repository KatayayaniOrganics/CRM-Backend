const Coupon = require('../Models/couponModel');
const logger = require('../logger');
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Agent = require('../Models/agentModel');



// Create a new coupon
exports.createCoupon = catchAsyncErrors(async (req, res) => {
    // Validate agentId
    const agent = await Agent.findById(req.body.agentId);
    if (!agent) {
        return res.status(400).json({ success: false, message: 'Invalid agentId' });
    }

// Fetch the last coupon to generate a new couponId
const lastCoupon = await Coupon.findOne().sort({ couponId: -1 }).exec();
let newCouponId = "COUPON001"; // Default value

if (lastCoupon && lastCoupon.couponId) {
    // Extract the numeric part from the couponId without spaces
    const lastCouponNumber = parseInt(lastCoupon.couponId.replace('COUPON', ''), 10);
    
    if (!isNaN(lastCouponNumber)) {
        const newCouponNumber = lastCouponNumber + 1;
        newCouponId = `COUPON${newCouponNumber.toString().padStart(3, "0")}`;
    } else {
        console.error("Invalid couponId format in the last coupon");
    }
}
    

    // Create a new coupon instance
    const coupon = new Coupon({
        couponId: newCouponId, // Use the generated couponId
        ...req.body, // Spread the rest of the request body
    });

    await coupon.save();
    logger.info(`Coupon created: ${coupon}`);
    const io = req.app.get('socketio'); // Get Socket.IO instance
    io.emit('new-coupon', coupon); 
    res.status(201).json({ success: true, data: coupon });
});
   
// Get all coupons
exports.getAllCoupons = catchAsyncErrors(async (req, res) => {
    const coupons = await Coupon.find().populate('agentId', 'agentName'); // Populate agentId with agentName
    logger.info('Fetched all coupons');
    const io = req.app.get('socketio'); // Get Socket.IO instance
    io.emit('all-coupons', coupons); 
    res.status(200).json({ success: true, data: coupons });
});

// Get a single coupon by ID
exports.getCouponById = catchAsyncErrors(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id).populate('agentId', 'agentName');
    if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    logger.info(`Fetched coupon: ${coupon}`);
    res.status(200).json({ success: true, data: coupon });
});

// Update a coupon by ID
exports.updateCoupon = catchAsyncErrors(async (req, res) => {
    const couponId = req.params.couponId; // Adjust to retrieve couponId from params
  
    // Use couponId to find and update the coupon
    const coupon = await Coupon.findOneAndUpdate(
      { couponId: couponId }, // Match based on couponId field
      req.body,
      { new: true, runValidators: true }
    );
  
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
  
    logger.info(`Updated coupon: ${coupon}`);
    const io = req.app.get('socketio'); // Get Socket.IO instance
    io.emit('update-coupons', coupon); 
    res.status(200).json({ success: true, data: coupon });
  });

// Delete a coupon by ID

exports.deleteCoupon = catchAsyncErrors(async (req, res) => {
    const coupon = await Coupon.findOneAndDelete({ couponId: req.params.couponId }); 
    if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    logger.info(`Deleted coupon: ${coupon}`);
    const io = req.app.get('socketio'); // Get Socket.IO instance
    io.emit('delete-coupons', coupon); 
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
});