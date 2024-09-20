const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const CustomerLead = require('../Models/customerLeadModel');
const{leadQueue}= require("../utils/kylasLeadPipeline.js")
const logger = require('../logger.js');
const Agent = require("../Models/agentModel.js")

exports.createLead = catchAsyncErrors(async (req, res) => {

    const lastLead = await CustomerLead.findOne().sort({ leadId: -1 }).exec();

    let newLeadId = "K0-1000"; // Default starting ID

    if (lastLead) {
      const lastLeadIdNumber = parseInt(lastLead.leadId.split("-")[1]);
      newLeadId = `K0-${lastLeadIdNumber + 1}`;
    }


    const newLead = new CustomerLead({
      ...req.body,
      leadId: newLeadId,
    });

    // Save the lead
    await newLead.save();

    res.status(201).json({
      message: "Customer lead created successfully",
      lead: newLead,
    });

});

exports.updateLead = catchAsyncErrors(async (req, res) => {
  const { leadId } = req.params;
  const updateData = req.body;

  // Check if the updateData contains leadId - prevent updating it
  if (updateData.leadId && updateData.leadId !== leadId) {
    return res.status(400).json({ message: "leadId cannot be updated." });
  }

  // Find the existing lead
  const existingLead = await CustomerLead.findOne({ leadId });

  if (!existingLead) {
    return res.status(404).json({ message: "Customer lead not found" });
  }

  // Find which fields are being updated
  const updatedFields = {};
  for (let key in updateData) {
    if (key !== "leadId" && updateData[key] !== existingLead[key]) {
      updatedFields[key] = updateData[key];
    }
  }
  const agent = await Agent.findById(req.user.id);
  const IpAddress = req.ip

  // Update the lead and add the changes to the `updatedData` field, using agentId
  const updatedLead = await CustomerLead.findOneAndUpdate(
    { leadId },
    {
      $set: {  ...updateData, // Update the fields in the lead
        LastUpdated_By: agent.agentId}, // Store the `agentId` of the updating agent},
      $push: {
        updatedData: {
          updatedBy: agent.agentId, // Assuming req.user contains the agentId
          updatedFields,
          ipAddress:IpAddress,
          updatedByEmail:agent.email,
          updatedAt: Date.now(),
        },
      },
    },
    { new: true, runValidators: true }
  );

  // If update was successful, return a success response with status code 200
  if (updatedLead) {
    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  }
});


exports.searchLead = catchAsyncErrors(async (req, res) => {

    const query = {};

    // Loop through the query parameters and add them to the search query
    for (let key in req.query) {
      if (req.query[key]) {
        if (key === 'leadId' || key === 'firstName' || key === 'lastName' || key === 'address' || key==='leadOwner'|| key==='email'||key==='contact') {
          query[key] = { $regex: req.query[key], $options: 'i' }; // Case-insensitive partial match
        } else {
          query[key] = req.query[key];
        }
      }
    }

    const lead = await CustomerLead.find(query) // Exclude password field
    res.json(lead);
  
});

exports.allLeads = catchAsyncErrors(async(req,res)=>{

  const allLeads = await CustomerLead.find();

  res.status(200).json({success:true,message:"All Leads that are available",allLeads})

})

exports.deleteLead = catchAsyncErrors(async (req, res) => {
  const { leadId } = req.params;

  // Find the customer lead by leadId and delete it
  const deletedLead = await CustomerLead.findOneAndDelete({ leadId });

  if (!deletedLead) {
    return res.status(404).json({ message: "Customer lead not found" });
  }

  res.json({ message: "Customer lead deleted successfully" });
});


exports.kylasLead = catchAsyncErrors(async (req, res) => {
  // Push the request to the queue
  leadQueue.push({ req, res });
});


exports.interactLead = catchAsyncErrors(async (req, res) => {
  try {
    const newLeadData = req.body;
    
    console.log(`Interact Lead Data: ${JSON.stringify(newLeadData)}`);

    res.status(200).json({
      success: true,
      message: "Lead created successfully",
      data: newLeadData
    });
  } catch (error) {

    logger.error(`Error processing lead: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the lead."
    });
  }
  
});
