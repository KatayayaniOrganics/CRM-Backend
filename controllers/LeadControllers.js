const CustomerLead = require('../Models/customerLeadModel');

exports.createLead = async (req, res) => {
    try {
      // Check if req.body is an array
      if (Array.isArray(req.body)) {
        // Use insertMany for bulk creation
        const customerLeads = await CustomerLead.insertMany(req.body);
        res.status(201).json({
          success: true,
          message: "CustomerLeads created successfully",
          customerLeads
        });
      } else {
        // Handle single document creation
        const customerLead = new CustomerLead(req.body);
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