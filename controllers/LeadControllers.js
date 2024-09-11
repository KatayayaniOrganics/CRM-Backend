const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const CustomerLead = require('../Models/customerLeadModel');
const logger = require('../logger.js')

exports.createLead = catchAsyncErrors(async (req, res) => {

    // Find the latest lead by sorting in descending order
    const lastLead = await CustomerLead.findOne().sort({ leadId: -1 }).exec();

    let newLeadId = "K0-1000"; // Default starting ID

    if (lastLead) {
      // Extract the numeric part from the last leadId and increment it
      const lastLeadIdNumber = parseInt(lastLead.leadId.split("-")[1]);
      newLeadId = `K0-${lastLeadIdNumber + 1}`;
    }

    // Create the new customer lead with the generated leadId
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

    // Find the customer lead by leadId and update it
    const updatedLead = await CustomerLead.findOneAndUpdate(
      { leadId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Customer lead not found" });
    }

    res.json(updatedLead);
  
})

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
  try {
    const newLeadData = req.body;
    logger.info(`New Lead Data: ${JSON.stringify(newLeadData)}`);
    
    // Find the last lead to generate a new lead ID
    const lastLead = await CustomerLead.findOne().sort({ leadId: -1 }).exec();
    let newLeadId = "K0-1000";

    if (lastLead) {
      const lastLeadIdNumber = parseInt(lastLead.leadId.split("-")[1]);
      newLeadId = `K0-${lastLeadIdNumber + 1}`;
    }

    const firstName = newLeadData.entity.firstName || '';
    const contact = newLeadData.entity.phoneNumbers[0].value || '';
    
    // Create the lead data object
    const leadData = {
      firstName: firstName,
      contact: contact,
      leadId: newLeadId,
    };

    // Only include the email field if it's not null or undefined
    if (newLeadData.entity.emails && newLeadData.entity.emails[0].value) {
      leadData.email = newLeadData.entity.emails[0].value;
    }

    console.log(`Lead Data: ${JSON.stringify(leadData)}`);

    // Create and save the new lead
    const newLead = new CustomerLead(leadData);
    await newLead.save();

    res.status(201).json({
      message: "Customer lead created successfully",
      lead: newLead,
    });

  } catch (error) {
    console.error(`Error processing adding request: ${error}`);
    res.status(500).json({
      message: 'Error processing adding request',
      error: error.message,
    });
  }
});
