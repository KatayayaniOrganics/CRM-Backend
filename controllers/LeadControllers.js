const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const CustomerLead = require('../Models/customerLeadModel');
const logger = require('../logger.js')

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

    const { entity } = req.body;

    const firstName = entity.firstName || entity.lastName;

    const phoneNumbers = entity.phoneNumbers && entity.phoneNumbers.length > 0 
      ? entity.phoneNumbers[0].value 
      : null;

    if (!firstName || !phoneNumbers) {
      return res.status(400).json({
        message: 'First Name (or Last Name) and Contact are required',
      });
    }

    const lastLead = await CustomerLead.findOne().sort({ leadId: -1 }).exec();

    let newLeadId = "K0-1000"; 
    let newLeadNumber = "1000"; // Initialize newLeadNumber early
    let newEmail = "Katyayani1000@gmail.com";

    if (lastLead) {
      const lastLeadIdNumber = parseInt(lastLead.leadId.split("-")[1]);
      newLeadId = `K0-${lastLeadIdNumber + 1}`;
      newLeadNumber = `${lastLeadIdNumber + 1}`; // Update newLeadNumber here
    }

    // Generate email
    if (entity.emails && entity.emails.length > 0) {
      newEmail = entity.emails[0].value;
    } else {
      newEmail = `Katyayani${newLeadNumber}@gmail.com`; // Use newLeadNumber
    }

    const LatestLeadData = {
      leadId: newLeadId,   
      firstName: firstName,
      lastName: entity.lastName || null,
      contact: phoneNumbers,
      email: newEmail,
    };

    const newLead = await CustomerLead.create(LatestLeadData);

    res.status(201).json({
      message: 'Lead created successfully',
      data: newLead,
    });
  } catch (error) {
    console.error(`Error processing adding request: ${error}`);
    res.status(500).json({
      message: 'Error processing adding request',
      error: error.message,
    });
  }
});
