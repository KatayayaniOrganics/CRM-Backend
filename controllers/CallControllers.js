const Calls = require("../Models/callsModel");
const logger = require("../logger");
const {catchAsyncErrors} = require('../middlewares/catchAsyncErrors');
const Agent = require('../Models/agentModel');

exports.CallDetailsCreation = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on CallDeatails creation Route");
    logger.info("Creating new call details");
  
    const lastCall = await Calls.findOne().sort({ callId: -1 }).exec();
  
    let newCallId = "CO-1001";
  
    if (lastCall) {
      // Extract the numeric part of the callId
      const lastCallNumber = parseInt(lastCall.callId.split("-")[1], 10);
  
      // Increment and create the new callId
      const newCallNumber = lastCallNumber + 1;
  
      // Ensure the numeric part is padded to the correct length
      newCallId = `CO-${newCallNumber.toString().padStart(2, "0")}`;
    }
  
    const callDetails = new Calls({
      ...req.body,
      callId: newCallId,
    });
  
    await callDetails.save();
    res
      .status(201)
      .send({ success: true, message: "Calls created successfully" });
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
    res.json(call);
    logger.info("Searching for calls");
  
});


exports.getAllCalls = catchAsyncErrors(async (req, res) => {
  const allCalls = await Calls.find();
  res.status(200).json(allCalls);
  logger.info("Fetching all calls");
});