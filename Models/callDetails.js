const mongoose = require('mongoose');

const callDetailsSchema = new mongoose.Schema({
    callId: {type:String , unique:true, default:"CO-1001"},
    query_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Query' },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerLead' },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    datetime: { type: Date, default: Date.now },
    duration: {
        type: Number,
        default:null
    },
    desposition:{
        type:String,
        default:null
    },
    reason_not_connected: String,
    order_amount:{
        type:Number,
        default:null
    },
    outcome:{
        type:String,
        default:null
    },
   startTime: {
    type: Date
   },
   phoneNumber: {
    type:String,
    default: null
},
   callType:{
    type:String,
    default: null
}  
});

const CallDetails = mongoose.model('CallDetails', callDetailsSchema);
module.exports = CallDetails;

