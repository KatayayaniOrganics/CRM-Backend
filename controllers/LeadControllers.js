const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const CustomerLead = require('../Models/customerLeadModel');

exports.createLead = catchAsyncErrors(async (req, res) => {

      // Access user information from the verified token
      const loggedInUser = req.user; // This contains the decoded token data
      console.log('Logged-in user:', loggedInUser);

      // You can add the logged-in user's information to the lead
      if (Array.isArray(req.body)) {
          // Add created_by field for each lead
          const leadsWithCreator = req.body.map(lead => ({
              ...lead,
              created_by: loggedInUser.id // Assuming the token contains user id
          }));

          const customerLeads = await CustomerLead.insertMany(leadsWithCreator);
          res.status(201).json({
              success: true,
              message: "CustomerLeads created successfully",
              customerLeads
          });
      } else {
          // Add created_by field for a single lead
          const customerLead = new CustomerLead({
              ...req.body,
              created_by: loggedInUser.id // Assuming the token contains user id
          });

          await customerLead.save();
          res.status(201).json({
              success: true,
              message: "CustomerLead created successfully",
              customerLead
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