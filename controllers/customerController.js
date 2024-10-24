const Customer = require("../Models/CustomerModel.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const logger = require('../logger.js');
const Agent = require('../Models/agentModel.js');
const Calls = require("../Models/callsModel");
const { categorizeCustomer } = require("./customerCategories.js");



exports.createCustomer = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Customer creation Route");
    try {
      const lastCustomer = await Customer.findOne().sort({ customerId: -1 }).exec();

  
      let newCustomerId = "CT-1000"; // Default starting ID
  
      if (lastCustomer && lastCustomer.customerId) {

        const lastCustomerIdNumber = parseInt(lastCustomer.customerId.split("-")[1]);

        newCustomerId = `CT-${lastCustomerIdNumber + 1}`;
      }
  

      // Calculate initial category based on order history
    const orderHistory = req.body.order_history || [];
    const orderCount = orderHistory.length;
    const totalOrderValue = orderHistory.reduce((sum, order) => sum + (order.orderValue || 0), 0);
    const initialCategory = categorizeCustomer(orderCount, totalOrderValue);

    const newCustomer = new Customer({
      ...req.body,
      customerId: newCustomerId,
      category: initialCategory,
    });

  
  
      await newCustomer.save();
      const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('new-customer', newCustomer);
  
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
  logger.info("You made a GET Request on Customer Route");
  const { customerId } = req.params; // Get customerId from query parameters
  if (customerId) {
      // Fetch a specific customer by customerId and populate call and order history
      const customer = await Customer.findOne({ customerId })
        .populate({
          path: 'call_history.callRef',
          model: 'Calls',
          select: '-callId  -__v -call_history -updatedData'
        })
        

      if (!customer) {
          return res.status(404).json({
              success: false,
              message: "Customer not found",
          });
      }

      const io = req.app.get('socket.io'); // Get Socket.IO instance
      io.emit('getone-customer', customer);
      return res.status(200).json({
          success: true,
          message: "Customer retrieved successfully",
          customer: customer,
      });
  }

  // Fetch all customers if no customerId is provided with pagination
  const page = parseInt(req.query.page) || 1; // Current page number
  const limit = parseInt(req.query.limit) || 100; // Number of customers per page
  const skip = (page - 1) * limit; // Calculate the number of customers to skip

  const allCustomers = await Customer.find().skip(skip).limit(limit)
    .populate({
      path: 'call_history.callRef',
      model: 'Calls'
    })
  const totalCustomers = await Customer.countDocuments(); // Get total number of customers

  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('get-customer', allCustomers);
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
  logger.info("You made a GET Request on Customer Search Route");
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
  const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('search-customer',customer);
  res.json(customer);
});

exports.deleteCustomer = catchAsyncErrors(async (req, res) => {
  logger.info("You made a DELETE Request on Customer Route");
  const { customerId } = req.params;

 
  const deletedCustomer = await Customer.findOneAndDelete({ customerId });

  if (!deletedCustomer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('delete-customer', deletedCustomer);
  res.json({ message: "Customer deleted successfully" });
});


exports.updateCustomer = catchAsyncErrors(async (req, res) => {
  logger.info("You made a PUT Request on Customer Route");
  const { customerId } = req.params;
  const updateData = req.body;

  // Prevent updating customerId
  if (updateData.customerId && updateData.customerId !== customerId) {
    return res.status(400).json({ message: "customerId cannot be updated." });
  }

  // Find the existing customer
  const existingCustomer = await Customer.findOne({ customerId });
  if (!existingCustomer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const agent = await Agent.findById(req.user.id);
  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.ip;

  // Collect fields that are being updated
  const updatedFields = {};
  for (let key in updateData) {
    if (key !== "customerId" && key !== "order_history" && key !== "call_history" && updateData[key] !== existingCustomer[key]) {
      updatedFields[key] = updateData[key];
    }
  }

  // Recalculate category if order_history is updated
  if (updateData.order_history) {
    const orderHistory = [...existingCustomer.order_history, ...updateData.order_history];
    const orderCount = orderHistory.length;
    const totalOrderValue = orderHistory.reduce((sum, order) => sum + (order.orderValue || 0), 0);
    updatedFields.category = categorizeCustomer(orderCount, totalOrderValue);
  }

  // Prepare the update object for MongoDB operations
  const updateObject = {
    $set: {
      LastUpdated_By: agent.agentId,
      ...updatedFields
    },
    $push: {
      updatedData: {
        updatedBy: agent.agentId,
        updatedFields: updatedFields,
        updatedByEmail: agent.email,
        updatedAt: Date.now(),
        ipAddress,
      }
    }
  };

  // Handle order_history updates and additions
  if (updateData.order_history) {
    updateData.order_history.forEach(order => {
      if (order._id) {
        // Update the specific order by _id
        const orderPath = `order_history.$[elem]`;
        updateObject.$set[orderPath] = order;
        updateObject.arrayFilters = updateObject.arrayFilters || [{ "elem._id": order._id }];
      } else {
        // Add new order using $push
        updateObject.$push.order_history = updateObject.$push.order_history || [];
        updateObject.$push.order_history.push(order);
      }
    });
  }

  // Handle call_history updates and additions
  if (updateData.call_history) {
    updateData.call_history.forEach(call => {
      if (call._id) {
        // Update the specific call by _id
        const callPath = `call_history.$[elem]`;
        updateObject.$set[callPath] = call;
        updateObject.arrayFilters = updateObject.arrayFilters || [];
        updateObject.arrayFilters.push({ "elem._id": call._id });
      } else {
        // Add new call using $push
        updateObject.$push.call_history = updateObject.$push.call_history || [];
        updateObject.$push.call_history.push({ callId: call.callId });
      }
    });
  }
  // Execute the update
  const updatedCustomer = await Customer.findOneAndUpdate(
    { customerId },
    updateObject,
    { new: true, runValidators: true, arrayFilters: updateObject.arrayFilters || [] }
  );

  if (!updatedCustomer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const io = req.app.get('socket.io');
  io.emit('update-customer', updatedCustomer);
  return res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: updatedCustomer,
  });
});

