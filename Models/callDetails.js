const mongoose = require('mongoose');

const callDetailsSchema = new mongoose.Schema({
    callId: {type:String , unique:true, default:"CO-1001"},
    query_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Query' },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerLead' },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agents' },
    datetime: { type: Date, default: Date.now },
    duration: Number,
    desposition:String,
    reason_not_connected: String,
    order_amount:Number,
    outcome:String,
   startTime: {
    type: Date
   },
   phoneNumber: String,
   callType:String 
});

const CallDetails = mongoose.model('CallDetails', callDetailsSchema);
module.exports = CallDetails;
