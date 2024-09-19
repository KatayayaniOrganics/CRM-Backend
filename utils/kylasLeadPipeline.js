const CustomerLead = require('../Models/customerLeadModel');
const async = require('async');
const logger = require('../logger.js'); 


// Create a queue to process one lead at a time
const leadQueue = async.queue(async (task, done) => {
  const { req, res } = task;

  try {
    logger.info("YOU MADE A REQ ON KYLAS POST ROUTE");
    const { entity } = req.body;
    let processedData = { entity };
    logger.info(`New Lead Data: ${JSON.stringify(processedData)}`);
    
    // Define the pipeline stages
    const stages = [
      validateRequiredFields,
      generateLeadId,
      generateOrUseEmail,
      checkForDuplicates,
      createLeadInDatabase,
    ];

    // Process the data through the pipeline
    for (const stage of stages) {
      processedData = await stage(processedData);
      if (processedData.error) {
        return res.status(processedData.status).json({
          message: processedData.message,
        });
      }
    }

    // Send the successful response
    res.status(201).json({
      message: 'Lead created successfully',
      data: processedData.newLead,
    });

  } catch (error) {
    logger.error(`Error processing adding request: ${error.message}`);
    res.status(500).json({
      message: 'Error processing adding request',
      error: error.message,
    });
  } finally {
    done();  // Mark the task as done to move to the next in the queue
  }
}, 1);

// Stage 1: Validate Required Fields (First Name and Contact)
async function validateRequiredFields(data) {
    const { entity } = data;
  
    const firstName = entity.firstName || entity.lastName;
    const phoneNumbers = entity.phoneNumbers && entity.phoneNumbers.length > 0 
      ? entity.phoneNumbers[0].value 
      : null;
  
    if (!firstName || !phoneNumbers) {
      return {
        error: true,
        status: 400,
        message: 'First Name (or Last Name) and Contact are required',
      };
    }
  
    data.firstName = firstName;
    data.contact = phoneNumbers;
  
    return data;
  }
  
  // Stage 2: Generate Lead ID
  async function generateLeadId(data) {
    const lastLead = await CustomerLead.findOne().sort({ leadId: -1 }).exec();
    let newLeadId = "K0-1000"; 
    let newLeadNumber = "1000"; 
  
    if (lastLead) {
      const lastLeadIdNumber = parseInt(lastLead.leadId.split("-")[1]);
      newLeadId = `K0-${lastLeadIdNumber + 1}`;
      newLeadNumber = `${lastLeadIdNumber + 1}`;
    }
    
    data.leadId = newLeadId;
    data.leadNumber = newLeadNumber;
  
    return data;
  }
  
  // Stage 3: Generate or Use Provided Email
  async function generateOrUseEmail(data) {
    const { entity, leadNumber } = data;
  
    data.email = entity.emails && entity.emails.length > 0 
      ? entity.emails[0].value 
      : `Katyayani${leadNumber}@gmail.com`;
  
    return data;
  }
  
  // Stage 4: Check for Duplicates
  async function checkForDuplicates(data) {
    const { email, contact, leadId } = data;
  
    const duplicateLead = await CustomerLead.findOne({
      $or: [
        { email },
        { contact },
        { leadId }
      ]
    });
  
    if (duplicateLead) {
      let duplicateField;
      if (duplicateLead.email === email) {
        duplicateField = 'email';
      } else if (duplicateLead.contact === contact) {
        duplicateField = 'contact';
      } else if (duplicateLead.leadId === leadId) {
        duplicateField = 'leadId';
      }
  
      return {
        error: true,
        status: 409,
        message: `Duplicate ${duplicateField} found: ${duplicateLead[duplicateField]}`,
      };
    }
  
    return data;
  }
  
  // Stage 5: Create Lead in Database
  async function createLeadInDatabase(data) {
    const newLeadData = {
      leadId: data.leadId,
      firstName: data.firstName,
      lastName: data.entity.lastName || null,
      contact: data.contact,
      email: data.email,
    };
  
    const newLead = await CustomerLead.create(newLeadData);
    
    data.newLead = newLead;
  
    return data;
  }


  module.exports = { leadQueue};