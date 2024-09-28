const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const Leads = require('../Models/LeadsModel.js');
const { leadQueue } = require("../utils/kylasLeadPipeline.js");
const logger = require('../logger.js');
const Agent = require("../Models/agentModel.js");
const UserRoles = require("../Models/userRolesModel.js");

// Create a new lead
exports.createLead = catchAsyncErrors(async (req, res) => {
    logger.info('Creating a new lead');
    const lastLead = await Leads.findOne().sort({ leadId: -1 }).exec();
    const newLeadId = lastLead ? `K0-${parseInt(lastLead.leadId.split("-")[1]) + 1}` : "K0-1000";

    const newLead = new Leads({
        ...req.body,
        leadId: newLeadId,
    });

    await newLead.save();
    logger.info(`Lead created successfully with ID: ${newLeadId}`);

    // Set follow-up time based on status
    if (newLead.status !== 'Answered') {
        newLead.followUpTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Set follow-up time to 24 hours later
        followUpQueue.push({ lead: newLead, res }); // Add to follow-up queue
    }

    res.status(201).json({
        message: "Lead created successfully",
        lead: newLead,
    });
});

// Update an existing lead
exports.updateLead = catchAsyncErrors(async (req, res) => {
    const { leadId } = req.params;
    const updateData = req.body;

    if (updateData.leadId && updateData.leadId !== leadId) {
        logger.warn(`Attempt to update leadId from ${leadId} to ${updateData.leadId}`);
        return res.status(400).json({ message: "LeadId cannot be updated." });
    }

    const [existingLead, agent] = await Promise.all([
        Leads.findOne({ leadId }),
        Agent.findById(req.user.id)
    ]);

    if (!existingLead) {
        logger.warn(`Lead not found with ID: ${leadId}`);
        return res.status(404).json({ message: "Lead not found" });
    }

    const updatedFields = {};
    for (let key in updateData) {
        if (key !== "leadId" && updateData[key] !== existingLead[key]) {
            updatedFields[key] = updateData[key];
        }
    }

    const updatedLead = await Leads.findOneAndUpdate(
        { leadId },
        {
            $set: { ...updateData, LastUpdated_By: agent.agentId },
            $push: {
                updatedData: {
                    updatedBy: agent.agentId,
                    updatedFields,
                    ipAddress: req.ip,
                    updatedByEmail: agent.email,
                    updatedAt: Date.now(),
                },
            },
        },
        { new: true, runValidators: true }
    );

    if (updatedLead) {
        logger.info(`Lead updated successfully with ID: ${leadId}`);
        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            data: updatedLead,
        });
    }

    // Similar logic should be added in the updateLead function to handle status changes and set follow-up times.
    if (updatedLead.status !== 'Answered' && updatedLead.followUpTime === null) {
        updatedLead.followUpTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Adjust follow-up time as needed
        followUpQueue.push({ lead: updatedLead, res }); // Re-add to follow-up queue if status changes
    }
});

// Search for leads based on query parameters
exports.searchLead = catchAsyncErrors(async (req, res) => {
    logger.info('Searching for leads');
    const query = {};

    for (let key in req.query) {
        if (req.query[key]) {
            query[key] = key === 'leadId' || key === 'firstName' || key === 'lastName' || key === 'address' || key === 'leadOwner' || key === 'email' || key === 'contact'
                ? { $regex: req.query[key], $options: 'i' }
                : req.query[key];
        }
    }

    const leads = await Leads.find(query);
    logger.info(`Found ${leads.length} leads matching the query`);
    res.json(leads);
});

// Retrieve all leads with optional pagination
exports.allLeads = catchAsyncErrors(async (req, res) => {
    const { leadId } = req.params;


    if (leadId) {
        logger.info(`Retrieving lead with ID: ${leadId}`);
        const lead = await Leads.findOne({ leadId });
        if (!lead) {
            logger.warn(`Lead not found with ID: ${leadId}`);
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        return res.status(200).json({ success: true, message: "Lead retrieved successfully", data: lead });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const agent = await Agent.findById(req.user.id);
    if (agent.user_role) {
        const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
        agent.user_role = userRole;  // Replace with the populated user role
      }
    // Corrected conditional logic for retrieving leads based on user role
    const query = (agent.user_role.role_name === 'Super Admin' || agent.user_role.role_name === 'Admin') ? {} : { leadOwner: agent.agentId };
    const [allLeads, totalLeads] = await Promise.all([
        Leads.find(query).skip(skip).limit(limit),
        Leads.countDocuments(query)
    ]);

    logger.info(`Retrieved ${allLeads.length} leads (page ${page}, limit ${limit})`);
    res.status(200).json({
        success: true,
        message: "Leads retrieved successfully",
        total: totalLeads,
        page,
        limit,
        data: allLeads,
    });
});

// Delete a lead by lead ID
exports.deleteLead = catchAsyncErrors(async (req, res) => {
    const { leadId } = req.params;
    logger.info(`Deleting lead with ID: ${leadId}`);

    const deletedLead = await Leads.findOneAndDelete({ leadId });

    if (!deletedLead) {
        logger.warn(`Lead not found with ID: ${leadId}`);
        return res.status(404).json({ message: "Lead not found" });
    }

    logger.info(`Lead deleted successfully with ID: ${leadId}`);
    res.json({ message: "Lead deleted successfully" });
});

// Handle Kylas lead requests by pushing them to the queue
exports.kylasLead = catchAsyncErrors(async (req, res) => {
    logger.info('Handling Kylas lead request');
    leadQueue.push({ req, res });
});

// Interact with a lead (for demonstration purposes)
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

// Function to assign a lead to an agent
exports.assignLead = catchAsyncErrors(async (req, res) => {
    const { leadId, agentId } = req.body;
    const lead = await Leads.findById(leadId);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    lead.assignedAgent = agentId;
    lead.status = 'Assigned';
    await lead.save();
    res.status(200).json({ message: "Lead assigned successfully", lead });
});

// Function to update lead status
exports.updateLeadStatus = catchAsyncErrors(async (req, res) => {
    const { leadId, status } = req.body;
    const lead = await Leads.findById(leadId);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    lead.status = status;
    await lead.save();
    res.status(200).json({ message: "Lead status updated successfully", lead });
});
