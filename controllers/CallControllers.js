const Calls = require("../Models/callsModel");
const logger = require("../logger");
const {catchAsyncErrors} = require('../middlewares/catchAsyncErrors');
const Agent = require('../Models/agentModel');
const Leads = require("../Models/LeadsModel");

const createNewCallId = async () => {
    const lastCall = await Calls.findOne().sort({ callId: -1 }).exec();
    if (lastCall) {
        const lastCallNumber = parseInt(lastCall.callId.split("-")[1], 10);
        const newCallNumber = lastCallNumber + 1;
        return `CO-${newCallNumber.toString().padStart(4, "0")}`;
    }
    return "CO-1001"; // Default if no calls are found
};

const formatCustomerId = (customerId) => {
    const numericPart = parseInt(customerId, 10);
    return `K0-${numericPart.toString().padStart(4, "0")}`;
};

const updateLeadCallHistory = async (formattedCustomerId, callId, callRef) => {
    const lead = await Leads.findOne({ leadId: formattedCustomerId });
    if (lead) {
        lead.call_history.push({ callID: callId, callRef: callRef, callDate: Date.now() });
        await lead.save();
    }
};

const updateAgentCallHistory = async (agentId, callId, callRef) => {
    const agent = await Agent.findOne({ email: agentId });
    if (agent) {
        agent.call_history.push({ callID: callId, callRef: callRef, callDate: Date.now() });
        await agent.save();
    }
};

exports.CallDetailsCreation = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on CallDetails creation Route");
    const { customer_id, agent_id } = req.body;

    const newCallId = await createNewCallId();
    const callDetails = new Calls({
        ...req.body,
        callId: newCallId,
        connectionStatus: 'initiated',
    });
    await callDetails.save();

    if (customer_id) {
        const formattedCustomerId = formatCustomerId(customer_id);
        await updateLeadCallHistory(formattedCustomerId, callDetails.callId, callDetails._id);
    }

    if (agent_id) {
        await updateAgentCallHistory(agent_id, callDetails.callId, callDetails._id);
    }

    const io = req.app.get('socket.io');
    io.emit('new-call', callDetails);
    res.status(201).send({ success: true, message: "Calls created successfully" });
    logger.info(callDetails);
});

exports.CallUpdate = catchAsyncErrors(async (req, res) => {
    const { callId } = req.params;
    const updateData = req.body;
    logger.info(`Updating call with ID: ${callId}`);
  
    // Check if the updateData contains callId - prevent updating it
    if (updateData.callId && updateData.callId !== callId) {
      return res.status(400).json({ message: "callId cannot be updated." });
    }
  
    // Find the existing lead
    const existingcall = await Calls.findOne({ callId });
  
    if (!existingcall) {
      return res.status(404).json({ message: "Call Details not found" });
    }
  
    // Find which fields are being updated
    const updatedFields = {};
    for (let key in updateData) {
      if (key !== "callId" && updateData[key] !== existingcall[key]) {
        updatedFields[key] = updateData[key];
      }
    }
    const agent = await Agent.findById(req.user.id);
  
  
    // Update the lead and add the changes to the updatedData field, using agentId
    const updatedCall = await Calls.findOneAndUpdate(
      { callId },
      {
        $set: {  ...updateData, // Update the fields in the lead
          LastUpdated_By: agent.agentId}, // Store the agentId of the updating agent},
        $push: {
          updatedData: {
            updatedBy: agent.agentId, // Assuming req.user contains the agentId
            updatedFields,
            updatedAt: Date.now(),            
          },
        },
      },
      { new: true, runValidators: true }
    );
  
    // If update was successful, return a success response with status code 200
    if (updatedCall) {
      const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('update-call', updatedCall); 
      return res.status(200).json({ 
        success: true,
        message: "CAll updated successfully",
        data: updatedCall,
      });
    }
  });


exports.CallDelete = catchAsyncErrors(async (req, res) => {
    logger.info("You made a DELETE Request on Calls delete Route");
    logger.info(`Deleting call with ID: ${callId}`);
  
    const callId = req.params.callId; 
  
    const result = await Calls.deleteOne({ callId: callId });
  
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Calls not found" });
    }
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('delete-call', result); 
    res.status(200).send({ success: true, message: "Calls deleted successfully" });
    logger.info(`Calls with callId ${callId} deleted successfully`);
  });
  

exports.callsearch = catchAsyncErrors(async (req, res) => {

    const query = {};
    for (let key in req.query) {
      if (req.query[key]) {
        if (key === 'phoneNumber' || key === 'callId' || key=== 'query_id' || key === 'countryCode') {
          query[key] = { $regex: req.query[key], $options: 'i' }; // Case-insensitive partial match
        } else {
          query[key] = req.query[key];
        }
      }
    }

    const call = await Calls.find(query) // Exclude password field
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('filter-call', call); 
    res.json(call);
    logger.info("Searching for calls");
  
});


exports.getAllCalls = catchAsyncErrors(async (req, res) => {
  const allCalls = await Calls.find();
  const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('all-call', allCalls); 
  res.status(200).json(allCalls);
  logger.info("Fetching all calls");
});
