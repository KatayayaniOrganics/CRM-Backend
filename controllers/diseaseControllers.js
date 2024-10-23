const Disease = require("../Models/diseaseModel.js");
const Agent = require("../Models/agentModel.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const logger = require('../logger.js');


exports.createDisease = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Disease creation Route");
  try {
    const lastDisease = await Disease.findOne().sort({ diseaseId: -1 }).exec();

    let newDiseaseId = "DO-1000"; // Default starting ID

    if (lastDisease && lastDisease.diseaseId) {
      const lastDiseaseIdNumber = parseInt(lastDisease.diseaseId.split("-")[1]);
      newDiseaseId = `DO-${lastDiseaseIdNumber + 1}`;
    }

    const newDisease = new Disease({
      ...req.body,
      diseaseId: newDiseaseId,
    });


    await newDisease.save();
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('new-disease', newDisease); // Emit event to all connected clients
    res.status(201).json({
      message: "Disease created successfully",
      disease: newDisease,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while creating the disease",
      error: error.message,
    });
  }
});


exports.allDisease = catchAsyncErrors(async (req, res) => {
  logger.info("You made a GET Request on Disease Route");
  const { diseaseId } = req.params; // Get diseaseId from query parameters

  if (diseaseId) {
      // Fetch a specific disease by diseaseId
      const disease = await Disease.findOne({ diseaseId });
      if (!disease) {
          return res.status(404).json({
              success: false,
              message: "Disease not found",
          });
      }
      const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('getone-disease', disease);
      return res.status(200).json({
          success: true,
          message: "Disease retrieved successfully",
          disease,
      });
  }

  // Fetch all customers if no customerId is provided
  const allDisease = await Disease.find();
  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('all-disease', allDisease);
  res.status(200).json({
      success: true,
      message: "All diseases that are available",
      allDisease,
  });
});

exports.searchDisease = catchAsyncErrors(async (req, res) => {
  logger.info("You made a GET Request on Disease Search Route");
  const query = {};


  for (let key in req.query) {
    if (req.query[key]) {
      if (key === 'diseaseId' || key === 'name') {
        query[key] = { $regex: req.query[key], $options: 'i' }; 
      } else {
        query[key] = req.query[key];
      }
    }
  }
  const disease = await Disease.find(query) 
  const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('search-disease', disease);
  res.json(disease);

});


exports.updateDisease = catchAsyncErrors(async (req, res) => {
  logger.info("You made a PUT Request on Disease Route");
  const { diseaseId } = req.params;
  const { solution, prevention, products, ...otherUpdates } = req.body; // Destructure the array fields from the request body

  // Check if the updateData contains diseaseId - prevent updating it
  if (otherUpdates.diseaseId && otherUpdates.diseaseId !== diseaseId) {
    return res.status(400).json({ message: "diseaseId cannot be updated." });
  }

  // Find the existing disease
  const existingDisease = await Disease.findOne({ diseaseId });
  if (!existingDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }

  // Find which fields are being updated
  const updatedFields = {};
  for (let key in otherUpdates) {
    if (otherUpdates[key] !== existingDisease[key]) {
      updatedFields[key] = otherUpdates[key];
    }
  }

  const agent = await Agent.findById(req.user.id);
  const ipAddress = req.headers['x-forwarded-for'] || req.ip;

  // Prepare the update object
  const update = {
    $set: otherUpdates,
    $push: {
      updatedData: {
        updatedBy: agent.agentId,
        updatedFields: { ...otherUpdates, solution, prevention, products }, // Include all fields being updated
        updatedByEmail: agent.email,
        updatedAt: Date.now(),
        ipAddress,
      }
    }
  };

  // Append new items to arrays if they exist in the request
  if (solution) {
    update.$push.solution = { $each: solution };
  }
  if (prevention) {
    update.$push.prevention = { $each: prevention };
  }
  if (products) {
    update.$push.products = { $each: products };
  }

  // Update the disease with the prepared update object
  const updatedDisease = await Disease.findOneAndUpdate({ diseaseId }, update, { new: true, runValidators: true });

  if (updatedDisease) {
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('update-disease', updatedDisease); // Emit event to all connected clients
    return res.status(200).json({
      success: true,
      message: "Disease updated successfully",
      data: updatedDisease
    });
  }
});

exports.deleteDisease = catchAsyncErrors(async (req, res) => {
  logger.info("You made a DELETE Request on Disease Route");
  const { diseaseId } = req.params;

 
  const deletedDisease = await Disease.findOneAndDelete({ diseaseId });

  if (!deletedDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }
  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('delete-disease', deletedDisease); // Emit event to all connected clients
  res.json({ message: "Disease deleted successfully" });
});

