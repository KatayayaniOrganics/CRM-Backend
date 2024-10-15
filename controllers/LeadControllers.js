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
    logger.info(`Updating lead with ID: ${req.params.leadId}`);
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

    // Retrieve the user role
    const userRole = await UserRoles.findOne({UserRoleId:agent.user_role});
    // Check if the agent is the lead's owner or has admin privileges
    if (existingLead.leadOwner !== agent.agentId && !['Admin', 'Super Admin'].includes(userRole.role_name)) {
        return res.status(403).json({ message: "Not authorized to update this lead" });
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
        if (!existingLead.callStatusHistory) {
            existingLead.callStatusHistory = [];
        }
        existingLead.callStatusHistory.push(updateData.callStatus.status);

        // Check the last three statuses for 'Not Answered'
        const recentStatuses = existingLead.callStatusHistory.slice(-3);
        if (recentStatuses.length === 3 && recentStatuses.every(status => status === 'Not Answered')) {
            updateData.followUpPriority = 'Closed';
        }
    }

    const callStatusHistory = updateData.callStatus ? updateData.callStatus.status : null;

    // Prepare update operations
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

    // Ensure callStatusHistory is updated in the database
    const updatedLead = await Leads.findOneAndUpdate(
        { leadId },
        updateOperations,
        { new: true, runValidators: true }
    );

    if (updatedLead) {
        logger.info(`Lead updated successfully with ID: ${leadId}`);
        const io = req.app.get('socket.io'); // Get Socket.IO instance
        if (io) {
            io.emit('updated-lead', updatedLead);
        } else {
            logger.error('Socket.io instance not found');
            // Consider how to handle this case, maybe a fallback or a retry mechanism
        }
        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            data: updatedLead,
        });
    }
});

exports.searchLead = catchAsyncErrors(async (req, res) => {
    logger.info('Searching for leads');

    const { user } = req; // Assuming the user's role is available in req.user
    const query = {};

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit; 

    for (let key in req.query) {
        if (req.query[key] && key !== 'page' && key !== 'limit') { // Exclude page and limit from the query filters
            query[key] = key === 'leadId' || key === 'firstName' || key === 'lastName' || key === 'address' || key === 'leadOwner' || key === 'email' || key === 'contact'
                ? { $regex: req.query[key], $options: 'i' } // Perform a case-insensitive search
                : req.query[key];
        }
    }

    if (user.role === 'Admin' || user.role === 'Super Admin') {
        logger.info(`User is ${user.role}, searching all leads`);
    
    } else if (user.role === 'Agent') {
        query.leadOwner = user._id; 
        logger.info(`User is Agent, filtering leads by leadOwner: ${user._id}`);
    } else {
        return res.status(403).json({ message: 'You do not have permission to search leads.' });
    }

    // Get total count of matching leads (for pagination metadata)
    const totalLeads = await Leads.countDocuments(query);

    // Find leads using the query with pagination (skip and limit)
    const leads = await Leads.find(query)
        .skip(skip)
        .limit(limit);

    logger.info(`Found ${leads.length} leads matching the query`);

    // Emit the result to connected clients via Socket.IO
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('Filtered-lead', leads); // Emit event to all connected clients

    // Respond with the leads and pagination information
    res.json({
        leads,
        page,
        totalPages: Math.ceil(totalLeads / limit), // Calculate total pages
        totalLeads,
        limit
    });
});

// Retrieve all leads with optional pagination
exports.allLeads = catchAsyncErrors(async (req, res) => {
    logger.info('Fetching all leads');
    const { leadId } = req.params;


    if (leadId) {
        logger.info(`Retrieving lead with ID: ${leadId}`);
        const lead = await Leads.findOne({ leadId });
        if(lead.leadOwner){
            const agent = await Agent.findOne({ agentId: lead.leadOwner }).select('agentId firstname lastname email');
            console.log(agent);
            lead.leadOwner = agent;
        }
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
    const query = (agent.user_role.role_name === 'Super Admin' || agent.user_role.role_name === 'Admin') ? {} : { leadOwner: agent.agentId };
    const allLeads = await Leads.find(query).skip(skip).limit(limit);
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