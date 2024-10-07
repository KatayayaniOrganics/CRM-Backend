const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    callId: {type:String , unique:true, default:"CO-1001"},
    query_id: { type: String, ref: 'Query' },
    customer_id: { type: String, ref: 'CustomerLead' },
    agent_id: { type: String, ref: 'Agent' },
    datetime: { type: Date, default: Date.now },
    duration: {
        type: Number,
        default:null
    },
    isMissedCall: { type: Boolean, default: false },
    outcome: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    callRecording: { type: String, default: null },
    countryCode:{type:String, default:null},
    updatedData: [
        {
          updatedBy: { type: String, ref: "Agents"}, // Using agentId instead of ObjectId
        updatedByEmail:{type:String},
        updatedFields: { type: Object },
        ipAddress:{type:String},
        updatedAt: { type: Date, default: Date.now },
        },
      ],
      LastUpdated_By: {
        type: String, // Use agentId here
        ref: "Agents", // Reference the Agent schema using agentId
      },
});

const Calls = mongoose.model('Calls', callSchema);
module.exports = Calls;
