const CustomerLead = require('../Models/customerLeadModel');

exports.createLead = async (req, res) => {
  try {
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
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};