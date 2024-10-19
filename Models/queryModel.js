const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    queryId: { 
        type: String, 
        unique: true,
        required: [true, "QueryId is required"],
        default: function() {
            return `QU-${Date.now()}`; // Example of a unique default
        }
    }, 
    leadId: { 
        type: String,
        required: false  
    },
    query_category: [
        {
            category_name: {
                type: String,
                required: true
            },
            selected_sub_options: {
                type: [String], // Array of strings
                required: [true, "selected_sub_options is required"]
            },
            description: {
                type: String,
                required: function() {
                    // Make 'description' required if 'Other' is in selected_sub_options array
                    return this.selected_sub_options && this.selected_sub_options.includes('Other');
                }
            }
        }
    ],
    reason_not_order: {
        type: String
    },
    action_taken: {
        type: String
    },
    created_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',  
        required: false
    },
    created_at: { 
        type: Date, 
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) // Indian Standard Time (IST)
    },
    updated_by: { 
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
