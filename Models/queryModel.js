const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerLead' },
    query_category: {
        type:String,
        required: [true, "Query category is required"]
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tags' }], 
    reason_not_ordered: String,
    description: String,
    created_at: { type: Date, default: Date.now },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Agents' }
});

const Query = mongoose.model('Query', querySchema);

 module.exports = Query;