const Lead = require('../Models/leadModel');

exports.createLead = async (req, res) => {
    const {} = req.body
    try { 
    const lead = await new Lead(req.body).save();
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

