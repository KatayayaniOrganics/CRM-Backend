const CallDetails = require("../Models/callDetails");
const logger = require("../logger");
const {catchAsyncErrors} = require('../middlewares/catchAsyncErrors')

exports.CallDetailsCreation = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on CallDeatails creation Route");
  
    const lastCall = await CallDetails.findOne().sort({ callId: -1 }).exec();
  
    let newCallId = "CO-1001";
  
    if (lastCall) {
      // Extract the numeric part of the callId
      const lastCallNumber = parseInt(lastCall.callId.split("-")[1], 10);
  
      // Increment and create the new callId
      const newCallNumber = lastCallNumber + 1;
  
      // Ensure the numeric part is padded to the correct length
      newCallId = `CO-${newCallNumber.toString().padStart(2, "0")}`;
    }
  
    const callDetails = new CallDetails({
      ...req.body,
      callId: newCallId,
    });
  
    await callDetails.save();
    res
      .status(201)
      .send({ success: true, message: "CallDetails created successfully" });
    logger.info(callDetails);
  });



  exports.CallUpdate = catchAsyncErrors(async (req, res) => {
    logger.info("You made a PUT Request on CallDetails update Route");

    const callId = req.params.callId; 
    const updatedData = req.body; 

    logger.info(`callId received: ${callId}`);
    logger.info(`Data to update: ${JSON.stringify(updatedData)}`);

    const updatedCallDetails = await CallDetails.findOneAndUpdate(
        { callId: callId }, 
        { $set: updatedData }, 
        { new: true, runValidators: true } 
    );

    if (!updatedCallDetails) {
        logger.warn(`No CallDetails found for callId: ${callId}`);
        return res.status(404).send({ success: false, message: "CallDetails not found" });
    }

    logger.info("CallDetails updated:", updatedCallDetails);
    res.status(200).send({ success: true, message: "CallDetails updated successfully", data: updatedCallDetails });
});


exports.CallDelete = catchAsyncErrors(async (req, res) => {
    logger.info("You made a DELETE Request on CallDetails delete Route");
  
    const callId = req.params.callId; 
  
    const result = await CallDetails.deleteOne({ callId: callId });
  
    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "CallDetails not found" });
    }
  
    res.status(200).send({ success: true, message: "CallDetails deleted successfully" });
    logger.info(`CallDetails with callId ${callId} deleted successfully`);
  });
  

exports.callFilter = catchAsyncErrors(async (req, res) => {

    const query = {};

    // Loop through the query parameters and add them to the search query
    for (let key in req.query) {
      if (req.query[key]) {
        if (key === 'phoneNumber' || key === 'callId' || key=== 'query_id'  ) {
          query[key] = { $regex: req.query[key], $options: 'i' }; // Case-insensitive partial match
        } else {
          query[key] = req.query[key];
        }
      }
    }

    const call = await CallDetails.find(query) // Exclude password field
    res.json(call);
  
});


