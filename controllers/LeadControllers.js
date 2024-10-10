const { catchAsyncErrors } = require('../middlewares/catchAsyncErrors');
const Leads = require('../Models/LeadsModel.js');
const { leadQueue } = require("../utils/kylasLeadPipeline.js");
const logger = require('../logger.js');
const Agent = require("../Models/agentModel.js");
const UserRoles = require("../Models/userRolesModel.js");
const Task = require("../Models/taskModel.js");

// Create a new lead
exports.createLead = catchAsyncErrors(async (req, res) => {
    logger.info('Creating new lead');
    const lastLead = await Leads.findOne().sort({ leadId: -1 }).exec();
    const newLeadId = lastLead ? `K0-${parseInt(lastLead.leadId.split("-")[1]) + 1}` : "K0-1000";

    const newLead = new Leads({
        ...req.body,
        leadId: newLeadId,
    });

    await newLead.save();
    logger.info(`Lead created successfully with ID: ${newLeadId}`); // Get Socket.IO instance
    io.emit('new-lead', newLead); // Emit event to all connected clients
    res.status(201).json({
        message: "Lead created successfully",
        lead: newLead,
    });
});

// Update an existing lead
exports.updateLead = catchAsyncErrors(async (req, res) => {
    logger.info(`Updating leads with IDs: ${req.params.leadId}`);
    // Split the leadId string into an array if it contains multiple IDs
    const leadIds = req.params.leadId.split(',').map(id => id.trim());
    const updateData = req.body;

    // Log the leadIds for debugging
    logger.info(`Received lead IDs: ${JSON.stringify(leadIds)}`);

    // Validate leadIds
    if (leadIds.length === 0) {
        return res.status(400).json({ message: "No Lead IDs provided." });
    }

    const [existingLeads, agent] = await Promise.all([
        Leads.find({ leadId: { $in: leadIds } }),
        Agent.findById(req.user.id)
    ]);

    // Log existing leads for debugging
    logger.info(`Existing leads found: ${JSON.stringify(existingLeads)}`);

    if (existingLeads.length === 0) {
        logger.warn(`No leads found with IDs: ${leadIds.join(', ')}`);
        return res.status(404).json({ message: "No leads found" });
    }

    // Retrieve the user role
    const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role });
    // Check if the agent is authorized to update the leads
    const unauthorizedLeads = existingLeads.filter(lead => lead.leadOwner.agentId !== agent.agentId && !['Admin', 'Super Admin'].includes(userRole.role_name));
    if (unauthorizedLeads.length > 0) {
        return res.status(403).json({ message: "Not authorized to update some leads" });
    }

    const updatedLeads = [];
    for (const lead of existingLeads) {
        const updatedFields = {};
        for (let key in updateData) {
            if (key !== "leadId" && updateData[key] !== lead[key]) {
                updatedFields[key] = updateData[key];
            }
        }

        // Check if leadOwner has changed and update assigned_leads of the new agent
        if (updateData.leadOwner && updateData.leadOwner.agentId && updateData.leadOwner.agentId !== lead.leadOwner.agentId) {
            const newOwnerAgent = await Agent.findOne({ agentId: updateData.leadOwner.agentId });
            if (newOwnerAgent) {
                // Check if the leadId is already assigned to prevent duplicates
                const isAlreadyAssigned = newOwnerAgent.assigned_leads.some(assignedLead => assignedLead.leadId === lead.leadId);
                if (!isAlreadyAssigned) {
                    newOwnerAgent.assigned_leads.push({ 
                        leadId: lead.leadId, 
                        leadRef: lead._id // Assuming lead._id is the ObjectId of the lead
                    });
                    await newOwnerAgent.save();
                }
            }
        }

        // Handling updates to callStatus and followUpPriority
        if (updateData.callStatus && updateData.callStatus.status) {
            updateData.callStatus.callTime = Date.now() + 5.5 * 60 * 60 * 1000; // Store the call time whenever status is updated

            // Set followUpPriority based on the call status
            switch (updateData.callStatus.status) {
                case 'Answered':
                    updateData.followUpPriority = 'Completed';
                    break;
                case 'Not Answered':
                    updateData.followUpPriority = 'Medium';
                    break;
                case 'Busy':
                case 'Not Reachable':
                    updateData.followUpPriority = 'High';
                    break;
            }

            // Track consecutive 'Not Answered' statuses to potentially close the follow-up
            if (!lead.callStatusHistory) {
                lead.callStatusHistory = [];
            }
            lead.callStatusHistory.push(updateData.callStatus.status);

            // Check the last three statuses for 'Not Answered'
            const recentStatuses = lead.callStatusHistory.slice(-3);
            if (recentStatuses.length === 3 && recentStatuses.every(status => status === 'Not Answered')) {
                updateData.followUpPriority = 'Closed';
            }
        }

        const callStatusHistory = updateData.callStatus ? updateData.callStatus.status : null;

        const updateOperations = {
            $set: { ...updateData, LastUpdated_By: agent.agentId },
            $push: {
                updatedData: {
                    updatedBy: agent.agentId,
                    updatedFields,
                    ipAddress: req.ip,
                    updatedByEmail: agent.email,
                    updatedAt: Date.now() + 5.5 * 60 * 60 * 1000,
                }
            }
        };
        // Conditionally push to callStatusHistory if not null
        if (callStatusHistory) {
            updateOperations.$push.callStatusHistory = callStatusHistory;
        }
        const updatedLead = await Leads.findOneAndUpdate(
            { leadId: lead.leadId },
            updateOperations,
            { new: true, runValidators: true }
        );

        if (updatedLead) {
            updatedLeads.push(updatedLead);
            logger.info(`Lead updated successfully with ID: ${lead.leadId}`);
        }
    }

    const io = req.app.get('socket.io'); // Get Socket.IO instance
    if (io) {
        updatedLeads.forEach(updatedLead => {
            io.emit('updated-lead', updatedLead);
        });
    } else {
        logger.error('Socket.io instance not found');
    }

    return res.status(200).json({
        success: true,
        message: "Leads updated successfully",
        data: updatedLeads,
    });
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
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('Filtered-lead', leads); // Emit event to all connected clients
    res.json(leads);
});

// Retrieve all leads with optional pagination
exports.allLeads = catchAsyncErrors(async (req, res) => {
    logger.info('Fetching all leads');
    const { leadId } = req.params;


    if (leadId) {
        logger.info(`Retrieving lead with ID: ${leadId}`);
        const lead = await Leads.findOne({ leadId }).populate({
            path: 'query.queryRef',
            select: '-updated_history -created_at -_id -queryId -__v'  // Exclude fields here
        }).populate({
            path: 'leadOwner.agentRef',  // Populate agentRef from leadOwner
            select: 'firstname lastname email contact state address city country'  // Only include these fields
        }).populate({
            path: 'farm_details.Crop_name.cropRef',  // Populate cropRef from farm_details.Crop_name
             select: '-updatedData -_id -__v -cropId'
        });
       
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

    // Define a priority map for sorting
    const priorityMap = {
        high: 1,
        medium: 2,
        low: 3,
        complete: 4,
        closed: 5
    };

    // Corrected conditional logic for retrieving leads based on user role
    const query = (agent.user_role.role_name === 'Super Admin' || agent.user_role.role_name === 'Admin') ? {} : { 'leadOwner.agentId': agent.agentId };
    const allLeads = await Leads.find(query).populate({
        path: 'query.queryRef',
        select: '-updated_history -created_at -_id -queryId -__v'  // Exclude fields here
    }).populate({
        path: 'leadOwner.agentRef',  // Populate agentRef from leadOwner
        select: 'firstname lastname email contact state address city country'  // Only include these fields
    }).populate({
        path: 'farm_details.Crop_name.cropRef',  // Populate cropRef from farm_details.Crop_name
    }).skip(skip).limit(limit);
    const totalLeads = await Leads.countDocuments(query);

    // Sort leads in memory based on the priority map
    allLeads.sort((a, b) => (priorityMap[a.followUpPriority] || 999) - (priorityMap[b.followUpPriority] || 999));

    logger.info(`Retrieved ${allLeads.length} leads (page ${page}, limit ${limit})`);
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('All-leads', allLeads); // Emit event to all connected clients
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
    logger.info(`Deleting lead with ID: ${req.params.leadId}`);
    const { leadId } = req.params;

    const deletedLead = await Leads.findOneAndDelete({ leadId });

    if (!deletedLead) {
        logger.warn(`Lead not found with ID: ${leadId}`);
        return res.status(404).json({ message: "Lead not found" });
    }

    logger.info(`Lead deleted successfully with ID: ${leadId}`);
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('Deleted-lead', deletedLead);
    res.status(200).json({ 
        success: true,
        message: "Lead deleted successfully",
        data:deletedLead
     });
});

// Handle Kylas lead requests by pushing them to the queue
exports.kylasLead = catchAsyncErrors(async (req, res) => {
    logger.info('Handling Kylas lead request');
    leadQueue.push({ req, res });
});

// Interact with a lead (for demonstration purposes)
exports.interactLead = catchAsyncErrors(async (req, res) => {
    logger.info('Interacting with lead');
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
    logger.info(`Updating lead status for ID: ${req.body.leadId}`);
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
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('New-leads', newTask,updatedLead); // Emit event to all connected clients
    res.status(200).json({
        message: "Lead callStatus updated and task created successfully",
        lead: updatedLead,
        task: newTask // Return the task if it was created
    });
});

// Update multiple leads
exports.updateMultipleLeads = catchAsyncErrors(async (req, res) => {
    logger.info(`Updating leads with IDs: ${req.body.leadIds}`);
    let leadIds = req.body.leadIds;
    if (!leadIds || leadIds.length === 0) {
        return res.status(400).json({ message: "No Lead IDs provided." });
    }
   
    // Split the leadId string into an array if it contains multiple IDs
    // leadIds = req.params.leadId.split(',').map(id => id.trim());
    const updateData = req.body;

    // Log the leadIds for debugging
    logger.info(`Received lead IDs: ${JSON.stringify(leadIds)}`);

    // Validate leadIds
    if (leadIds.length === 0) {
        return res.status(400).json({ message: "No Lead IDs provided." });
    }

    const [existingLeads, agent] = await Promise.all([
        Leads.find({ leadId: { $in: leadIds } }),
        Agent.findById(req.user.id)
    ]);

    // Log existing leads for debugging
    logger.info(`Existing leads found: ${JSON.stringify(existingLeads)}`);

    if (existingLeads.length === 0) {
        logger.warn(`No leads found with IDs: ${leadIds.join(', ')}`);
        return res.status(404).json({ message: "No leads found" });
    }

    // Retrieve the user role
    const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role });
    // Check if the agent is authorized to update the leads
    const unauthorizedLeads = existingLeads.filter(lead => lead.leadOwner.agentId !== agent.agentId && !['Admin', 'Super Admin'].includes(userRole.role_name));
    if (unauthorizedLeads.length > 0) {
        return res.status(403).json({ message: "Not authorized to update some leads" });
    }

    const updatedLeads = [];
    for (const lead of existingLeads) {
        const updatedFields = {};
        for (let key in updateData) {
            if (key !== "leadId" && updateData[key] !== lead[key]) {
                updatedFields[key] = updateData[key];
            }
        }

        // Check if leadOwner has changed and update assigned_leads of the new agent
        if (updateData.leadOwner && updateData.leadOwner.agentId && updateData.leadOwner.agentId !== lead.leadOwner.agentId) {
            const newOwnerAgent = await Agent.findOne({ agentId: updateData.leadOwner.agentId });
            if (newOwnerAgent) {
                // Check if the leadId is already assigned to prevent duplicates
                const isAlreadyAssigned = newOwnerAgent.assigned_leads.some(assignedLead => assignedLead.leadId === lead.leadId);
                if (!isAlreadyAssigned) {
                    newOwnerAgent.assigned_leads.push({ 
                        leadId: lead.leadId, 
                        leadRef: lead._id // Assuming lead._id is the ObjectId of the lead
                    });
                    await newOwnerAgent.save();
                }
            }
        }

        // Handling updates to callStatus and followUpPriority
        if (updateData.callStatus && updateData.callStatus.status) {
            updateData.callStatus.callTime = Date.now() + 5.5 * 60 * 60 * 1000; // Store the call time whenever status is updated

            // Set followUpPriority based on the call status
            switch (updateData.callStatus.status) {
                case 'Answered':
                    updateData.followUpPriority = 'Completed';
                    break;
                case 'Not Answered':
                    updateData.followUpPriority = 'Medium';
                    break;
                case 'Busy':
                case 'Not Reachable':
                    updateData.followUpPriority = 'High';
                    break;
            }

            // Track consecutive 'Not Answered' statuses to potentially close the follow-up
            if (!lead.callStatusHistory) {
                lead.callStatusHistory = [];
            }
            lead.callStatusHistory.push(updateData.callStatus.status);

            // Check the last three statuses for 'Not Answered'
            const recentStatuses = lead.callStatusHistory.slice(-3);
            if (recentStatuses.length === 3 && recentStatuses.every(status => status === 'Not Answered')) {
                updateData.followUpPriority = 'Closed';
            }
        }

        const callStatusHistory = updateData.callStatus ? updateData.callStatus.status : null;

        const updateOperations = {
            $set: { ...updateData, LastUpdated_By: agent.agentId },
            $push: {
                updatedData: {
                    updatedBy: agent.agentId,
                    updatedFields,
                    ipAddress: req.ip,
                    updatedByEmail: agent.email,
                    updatedAt: Date.now() + 5.5 * 60 * 60 * 1000,
                }
            }
        };
        // Conditionally push to callStatusHistory if not null
        if (callStatusHistory) {
            updateOperations.$push.callStatusHistory = callStatusHistory;
        }
        const updatedLead = await Leads.findOneAndUpdate(
            { leadId: lead.leadId },
            updateOperations,
            { new: true, runValidators: true }
        );

        if (updatedLead) {
            updatedLeads.push(updatedLead);
            logger.info(`Lead updated successfully with ID: ${lead.leadId}`);
        }
    }

    const io = req.app.get('socket.io'); // Get Socket.IO instance
    if (io) {
        updatedLeads.forEach(updatedLead => {
            io.emit('updated-lead', updatedLead);
        });
    } else {
        logger.error('Socket.io instance not found');
    }

    return res.status(200).json({
        success: true,
        message: "Leads updated successfully",
        data: updatedLeads,
    });
});
