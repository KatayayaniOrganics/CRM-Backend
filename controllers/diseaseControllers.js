const Disease = require("../Models/diseaseModel.js");
const Agent = require("../Models/agentModel.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const logger = require('../logger.js');


exports.createDisease = catchAsyncErrors(async (req, res) => {
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
  const allDisease = await Disease.find()

  res.status(200).json({
    success: true,
    message: "All Disease that are available",
    allDisease,
  });
});

exports.searchDisease = catchAsyncErrors(async (req, res) => {

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
  res.json(disease);

});

exports.updateDisease = catchAsyncErrors(async (req, res) => {
  const { diseaseId } = req.params;
  const updateData = req.body;

  // Check if the updateData contains diseaseId - prevent updating it
  if (updateData.diseaseId && updateData.diseaseId !== diseaseId) {
    return res.status(400).json({ message: "diseaseId cannot be updated." });
  }

  // Find the existing disease
  const existingDisease = await Disease.findOne({ diseaseId });

  if (!existingDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }

  // Find which fields are being updated
  const updatedFields = {};
  for (let key in updateData) {
    if (key !== "diseaseId" && updateData[key] !== existingDisease[key]) {
      updatedFields[key] = updateData[key];
    }
  }

  const agent = await Agent.findById(req.user.id);

  // Capture the full IP address from the request
  const ipAddress = req.headers['x-forwarded-for'] || req.ip;

  // Update the disease and add the changes to the updatedData field, using agentId and IP address
  const updatedDisease = await Disease.findOneAndUpdate(
    { diseaseId },
    {
      $set: {
        ...updateData, // Update the fields in the disease
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

  if (updatedDisease) {
    return res.status(200).json({
      success: true,
      message: "Disease updated successfully",
      data: updatedDisease,
    });
  }
});

exports.deleteDisease = catchAsyncErrors(async (req, res) => {
  const { diseaseId } = req.params;

 
  const deletedDisease = await Disease.findOneAndDelete({ diseaseId });

  if (!deletedDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }

  res.json({ message: "Disease deleted successfully" });
});

