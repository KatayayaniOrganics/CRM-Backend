const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const Leads = require('../Models/LeadsModel.js');
const { leadQueue } = require("../utils/kylasLeadPipeline.js");
const logger = require('../logger.js');
const Agent = require("../Models/agentModel.js");
const UserRoles = require("../Models/userRolesModel.js");
const Task = require("../Models/taskModel.js");

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

    // Set follow-up time based on callStatus
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

    // Check if leadOwner has changed and update assigned_leads of the new agent
    if (updateData.leadOwner && updateData.leadOwner !== existingLead.leadOwner) {
        const newOwnerAgent = await Agent.findOne({ agentId: updateData.leadOwner });
        if (newOwnerAgent) {
            // Check if the leadId is already assigned to prevent duplicates
            const isAlreadyAssigned = newOwnerAgent.assigned_leads.some(assignedLead => assignedLead.lead_id === leadId);
            if (!isAlreadyAssigned) {
                newOwnerAgent.assigned_leads.push({ lead_id: leadId });
                await newOwnerAgent.save();
            }
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

// Function to update lead status and create a task if the status is not 'Answered'
exports.updateLeadStatus = catchAsyncErrors(async (req, res) => {
    const { leadId, callStatus } = req.body;
    const agent = await Agent.findById(req.user.id)
    if (agent.user_role) {
      const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
      agent.user_role = userRole;  // Replace with the populated user role
    } 


    // Retrieve the lead to check ownership
    const lead = await Leads.findOne({ leadId });

    if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
    }

    // Check if the agent is the lead's owner, an admin, or a superadmin
    if (lead.leadOwner !== agent.agentId && !['Admin', 'Super Admin'].includes(agent.user_role.role_name)) {
        return res.status(403).json({ message: "Not authorized to update this lead's status" });
    }

    // Update the lead's callStatus using findOneAndUpdate
    const updatedLead = await Leads.findOneAndUpdate(
        { leadId },
        { $set: { callStatus: callStatus } },
        { new: true, runValidators: true }
    );

    if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
    }

    let newTask = null; // Define newTask outside the conditional block

    // Check if the callStatus is not 'Answered' and create a task
    if (callStatus !== 'Answered') {
        const taskPriority = {
            'Not Answered': 'Low',
            'Busy': 'Medium',
            'Not Reachable': 'High'
        };

        // Determine due date based on priority
        const dueDateOffset = {
            'Low': 24 * 60 * 60 * 1000, // 1 day in milliseconds
            'Medium': 4 * 60 * 60 * 1000, // 4 hours in milliseconds
            'High': 2 * 60 * 60 * 1000  // 2 hours in milliseconds
        };

        const priority = taskPriority[callStatus];
        const currentTime = Date.now();
        const offsetTime = dueDateOffset[priority];

        // Calculate due date in UTC
        const dueDateUTC = new Date(currentTime + offsetTime);

        // Convert UTC to IST (UTC+5:30)
        const ISTOffset = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
        const dueDateIST = new Date(dueDateUTC.getTime() + ISTOffset);
        const taskNameDe = {
            'Not Answered': '1 Day',
            'Busy': '4 Hours',
            'Not Reachable': '2 Hours'
        };
        const taskName = `Follow-up for Lead ID: ${leadId} in ${taskNameDe[callStatus]}`;

        newTask = new Task({
            task_name: taskName,
            task_description: `This task is created to follow-up on the lead with ID: ${leadId} which was ${callStatus}.`,
            task_status: 'Open',
            task_priority: priority,
            task_due_date: dueDateIST,
            task_created_by: agent.agentId, // Assuming req.user.id is the ID of the logged-in agent
        });

        await newTask.save();
    }

    res.status(200).json({
        message: "Lead callStatus updated and task created successfully",
        lead: updatedLead,
        task: newTask // Return the task if it was created
    });
});