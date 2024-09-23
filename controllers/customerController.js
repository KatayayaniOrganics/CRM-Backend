const Customer = require("../Models/CustomerModel.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const logger = require('../logger.js');


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

  // Fetch all customers if no customerId is provided
  const allCustomer = await Customer.find();

  res.status(200).json({
      success: true,
      message: "All customers that are available",
      allCustomer,
  });
});