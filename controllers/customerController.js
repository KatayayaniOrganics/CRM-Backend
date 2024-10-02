const Customer = require("../Models/CustomerModel.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const logger = require('../logger.js');
const Agent = require('../Models/agentModel.js');


exports.createCustomer = catchAsyncErrors(async (req, res) => {
    try {
      const lastCustomer = await Customer.findOne().sort({ customerId: -1 }).exec();

  
      let newCustomerId = "CT-1000"; // Default starting ID
  
      if (lastCustomer && lastCustomer.customerId) {

        const lastCustomerIdNumber = parseInt(lastCustomer.customerId.split("-")[1]);

        newCustomerId = `CT-${lastCustomerIdNumber + 1}`;
      }
  

      const newCustomer = new Customer({
        ...req.body,
        customerId: newCustomerId,

      });
  
  
      await newCustomer.save();
  
      res.status(201).json({

        message: "Customer created successfully",
        customer: newCustomer,
      });
    } catch (error) {

      res.status(500).json({
        message: "An error occurred while creating the customer",
        error: error.message,
      });

    }
});


exports.allCustomer = catchAsyncErrors(async (req, res) => {
  const { customerId } = req.params; // Get customerId from query parameters

  if (customerId) {
      // Fetch a specific customer by customerId
      const customer = await Customer.findOne({ customerId });
      if (!customer) {
          return res.status(404).json({
              success: false,
              message: "Customer not found",
          });
      }

      return res.status(200).json({
          success: true,
          message: "Customer retrieved successfully",
          customer,
      });
  }

  // Fetch all customers if no customerId is provided with pagination
  const page = parseInt(req.query.page) || 1; // Current page number
  const limit = parseInt(req.query.limit) || 100; // Number of customers per page
  const skip = (page - 1) * limit; // Calculate the number of customers to skip

  const [allCustomers, totalCustomers] = await Promise.all([
      Customer.find().skip(skip).limit(limit), // Fetch customers with pagination
      Customer.countDocuments() // Get total number of customers
  ]);

  res.status(200).json({
      success: true,
      message: "All customers that are available",
      total: totalCustomers,
      page,
      limit,
      data: allCustomers,
  });
});

exports.searchCustomer = catchAsyncErrors(async (req, res) => {
  const query = {};

  for (let key in req.query) {
    if (req.query[key]) {
      // Check if the key is one of the expected fields
      if (key === 'customerId' || key === 'firstName' || key === 'lastName' || key === 'email' || key === 'leadId') {
        query[key] = { $regex: req.query[key], $options: 'i' }; 
      } else if (key === 'number') { // Assuming you want to search by a field named 'number'
        query[key] = req.query[key]; // Directly assign the number value
      } else {
        query[key] = req.query[key];
      }
    }
  }

  const customer = await Customer.find(query);
  res.json(customer);
});

exports.deleteCustomer = catchAsyncErrors(async (req, res) => {
  const { customerId } = req.params;

 
  const deletedCustomer = await Customer.findOneAndDelete({ customerId });

  if (!deletedCustomer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  res.json({ message: "Customer deleted successfully" });
});

exports.updateCustomer = catchAsyncErrors(async (req, res) => {
  const { customerId } = req.params;
  const updateData = req.body;

  // Check if the updateData contains diseaseId - prevent updating it
  if (updateData.customerId && updateData.customerId !== customerId) {
      return res.status(400).json({ message: "customerId cannot be updated." });
  }

    // Find the existing customer
  const existingCustomer = await Customer.findOne({ customerId });

  if (!existingCustomer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  // Find which fields are being updated
  const updatedFields = {};
  for (let key in updateData) {
    if (key !== "customerId" && updateData[key] !== existingCustomer[key]) {
      updatedFields[key] = updateData[key];
    }
  }

  const agent = await Agent.findById(req.user.id);

  // Capture the full IP address from the request
  const ipAddress = req.headers['x-forwarded-for'] || req.ip;

  // Update the disease and add the changes to the updatedData field, using agentId and IP address
  const updatedCustomer = await Customer.findOneAndUpdate(
    { customerId },
    {
      $set: {
        ...updateData, // Update the fields in the customer
        LastUpdated_By: agent.agentId, // Store the agentId of the updating agent
      },
      $push: {
        updatedData: {
          updatedBy: agent.agentId,  // Assuming req.user contains the agentId
          updatedFields,
          updatedByEmail:agent.email,
          updatedAt: Date.now(),
          ipAddress,  // Store the full IP address
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (updatedCustomer) {
    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  }
});
