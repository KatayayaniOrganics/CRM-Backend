const mongoose = require('mongoose');

const customerLeadSchema = new mongoose.Schema({
    leadOwner: { type: String,  },
    firstName: { type: String },
    lastName: { type: String,  },
    email: { type: String },
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' }, 
    contact: { type: String, },
    created_at: { type: Date, default: Date.now },
    responded_at: Date,
    query: { type: mongoose.Schema.Types.ObjectId, ref: 'Query' },
    address: String,
    order_history: [{
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
    }],
    farm_details: {
        area: String,
        crops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crop' }]  
    },
    call_history: [{
            
    }],
    lead_category: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tags' }],

    // For additional fields that may be added dynamically
    additionalFields: { type: mongoose.Schema.Types.Mixed, default: {} }

}, {
    timestamps: true
});

const CustomerLead = mongoose.model('CustomerLead', customerLeadSchema);

module.exports = CustomerLead;
