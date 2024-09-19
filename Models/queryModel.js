const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    customer_id: { 
        type: String, 
        ref: 'CustomerLead',
        unique:true,
         default: "Qu-101",
        required: [true, "Customer ID is required"]
    },
    query_category: {
        type: String
    },
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order' 
    },
    tags: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tags' 
    }], 
    reason_not_ordered: String,
    description: { 
        type: String, 
        required: [true, "Description is required"]
    },
    created_at: { type: Date, default: Date.now },
    updated_By: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_history: [
        {
            updated_at: { type: Date, default: Date.now },
            updated_data: { type: Object },
            updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ]
   
});

const Query = mongoose.model('Query', querySchema);

module.exports = Query;
