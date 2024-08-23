const logger = require('../logger');
const CustomerLead = require('../Models/customerLeadModel');


exports.createLead = async (req, res) => {
    logger.info("You made a POST Request on Creating Customer lead Route")

  try {
      // Access user information from the verified token
      const loggedInUser = req.user; // This contains the decoded token data

      // You can add the logged-in user's information to the lead
      if (Array.isArray(req.body)) {
          // Add created_by field for each lead
          const leadsWithCreator = req.body.map(lead => ({
              ...lead,
              created_by: loggedInUser.id // Assuming the token contains user id
          }));

          const customerLeads = await CustomerLead.insertMany(leadsWithCreator);
         logger.info("Customer leads Created Successfully")

          res.status(201).json({
              success: true,
              message: "CustomerLeads created successfully",
              customerLeads : customerLeads._id
          });
      } else {
          // Add created_by field for a single lead
          const customerLead = new CustomerLead({
              ...req.body,
              created_by: loggedInUser.id // Assuming the token contains user id
          });

          await customerLead.save();
         logger.info("Customer lead Created Successfully")

          res.status(201).json({
              success: true,
              message: "CustomerLead created successfully",
              customerlead: customerLead._id
          });
      }
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

//update Lead
exports.updateLead = async (req, res) => {
    logger.info("You made a POST Request on Updating Customer lead Route")

    try {
        // Access user information from the verified token
        const loggedInUser = req.user; // This contains the decoded token data

        const leadId = req.params.id; // Assuming the lead ID is passed as a URL parameter
        const updateData = req.body;
        // Optionally, add fields like `updated_by` and `updated_at` to track who updated the lead and when
        updateData.updated_by = loggedInUser.id;
        updateData.updated_at = new Date();

        const updatedLead = await CustomerLead.findByIdAndUpdate(
            leadId,
            { $set: updateData },
            { new: true, runValidators: true } // return the updated document
        );

        if (!updatedLead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        logger.info("Customer lead Updated Successfully")
        
        res.status(200).json({
            success: true,
            message: "CustomerLead updated successfully",
            updatedLead
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
