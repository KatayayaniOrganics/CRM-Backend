const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    query_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Query' },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerLead' },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agents' },
    products: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' }
    }],
    order_amount: Number
});

const Order = mongoose.model('Order', orderSchema);
module.exports=Order;

