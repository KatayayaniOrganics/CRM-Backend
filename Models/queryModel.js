const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  queryId: { 
        type: String, 
        unique: true,
        default: "QU-1000",
        required: [true, "QueryId is required"]
    }, 
    leadId: { 
        type: String, 
        ref: 'CustomerLead',  
        required: false  
    },
    title: { 
        type: String, 
        required:false
    },
    subtitle: { 
        type: String, 
        required: false  
    },
    description: { 
        type: String, 
        required: false  
    },
    other: { 
        type: String,  
        required: false  
    },
    created_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',  
        required: false
    },
    created_at: { 
        type: Date, 
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) 
    },
    updated_By: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false
    },
    updated_history: [
        {
            updated_at: { 
                type: Date, 
                default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) 
            },
            updated_data: { 
                type: Object 
            },
            updated_by: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User' 
            }
        }
    ]
});

const Query = mongoose.model('Query', querySchema);

module.exports = Query;
