const express = require('express');
const router = express.Router();
const CustomerLead = require('../models/CustomerLead');

// POST route to create a new lead
router.post('/new', async (req, res) => {
    try {
        const {
            leadOwner,
            firstName,
            lastName,
            email,
            cast,
            address1,
            address2,
            city,
            State,
            country,
            contact,
            lead_category,
            source,
            query,
            order_history,
            farm_details,
            call_history,
            tags,
            additionalFields
        } = req.body;

        // Validate required fields
        if (!leadOwner || !firstName || !lastName || !email || !contact) {
            return res.status(400).json({ message: 'LeadOwner, First Name, Last Name, Email, and Contact are required.' });
        }

        // Create a new lead
        const newLead = new CustomerLead({
            leadOwner,
            firstName,
            lastName,
            email,
            cast,
            address1,
            address2,
            city,
            State,
            country,
            contact,
            lead_category,
            source,
            query,
            order_history,
            farm_details,
            call_history,
            tags,
            additionalFields
        });

        // Save the lead to the database
        await newLead.save();

        // Respond with success message
        res.status(201).json({ message: 'Lead created successfully', lead: newLead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
