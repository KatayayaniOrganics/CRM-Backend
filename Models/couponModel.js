const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponId: {
        type: String,
        required: true,
        unique: true, 
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent', 
        required: true,
    },
    couponName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    maxAmount: {
        type: Number,
        required: true,
    },
    minAmount: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
