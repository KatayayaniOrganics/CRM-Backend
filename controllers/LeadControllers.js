const CustomerLead = require('../Models/customerLeadModel');

exports.createLead = async (req, res) => {
   
    try { 
    const customerLead = await new CustomerLead(req.body).save();
        res.status(201).json({
            success: true,
            message: 'CustomerLead created successfully',
            customerLead
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

