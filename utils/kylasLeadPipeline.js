const CustomerLead = require('../Models/customerLeadModel');

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


  module.exports = { validateRequiredFields,generateLeadId,generateOrUseEmail,checkForDuplicates,createLeadInDatabase};