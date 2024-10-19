const Crop = require("../Models/cropModel");            
const logger = require("../logger");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Disease = require("../Models/diseaseModel"); 
const Agent = require("../Models/agentModel");


exports.CropsCreation = catchAsyncErrors(async (req, res) => {
  logger.info("Creating new crop");
  logger.info("You made a POST Request on Crops creation Route");

  // Get the last crop and generate a new crop ID
  const lastCrop = await Crop.findOne().sort({ cropId: -1 }).exec();
  
  let newCropId = "CS-01";
  if (lastCrop) {
    const lastCropNumber = parseInt(lastCrop.cropId.split("-")[1], 10);
    const newCropNumber = lastCropNumber + 1;
    newCropId = `CS-${newCropNumber.toString().padStart(2, "0")}`;
  }

  const stages = req.body.stages; 
  const cropStages = [];

  // Loop through the stages and process each one
  for (let stage of stages) {
    const diseaseIds = stage.diseases.map(d => d.diseaseId); // Ensure only diseaseIds are extracted

    logger.info(`Received disease IDs for stage '${stage.name}': ${diseaseIds.join(", ")}`);

    // Find the diseases by their IDs
    const foundDiseases = await Disease.find({ diseaseId: { $in: diseaseIds } });
    const validDiseaseIds = foundDiseases.map(disease => disease.diseaseId);

    // Filter out invalid disease IDs
    const invalidDiseaseIds = diseaseIds.filter(id => !validDiseaseIds.includes(id));
    if (invalidDiseaseIds.length > 0) {
      logger.warn(`Invalid diseaseIds provided for stage '${stage.name}': ${invalidDiseaseIds.join(", ")}`);
    }

    // Push valid disease IDs into crop stages
    cropStages.push({
      name: stage.name, 
      stage: stage.stage,
      duration: stage.duration,
      diseases: validDiseaseIds.map(id => ({ diseaseId: id, diseaseRef: foundDiseases.find(d => d.diseaseId === id)._id })), // Map valid IDs to their references
    });

    logger.info(`Storing valid disease IDs for stage '${stage.name}': ${validDiseaseIds.join(", ")}`);
  }

  // Create and save the new crop
  const crop = new Crop({
    ...req.body,
    cropId: newCropId,
    cropImage: req.body.cropImage,
    stages: cropStages,
  });

  await crop.save();
  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('new-crop', crop); // Emit event to all connected clients
  res.status(201).send({ success: true, message: "Crop created successfully", crop });
  logger.info(crop);
}); 


exports.allCrops = catchAsyncErrors(async (req, res) => {
  logger.info("Fetching all crops");

  const { cropId } = req.params; // Get cropId from query parameters

  if (cropId) {
    // Fetch a specific crop by cropId
    const crop = await Crop.findOne({ cropId }).populate({
      path: 'stages.diseases.diseaseRef',
      model: 'Disease',
      select: '-updatedData -_id -__v' 
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('getone-crop', crop);
    // Return the crop with populated diseases in stages
    return res.status(200).json({
      success: true,
      message: "Crop retrieved successfully",
      crop: crop,
    });
  }

  // Fetch all crops if no cropId is provided
  const allCrops = await Crop.find().populate({
    path: 'stages.diseases.diseaseRef',
    model: 'Disease',
    select: '-updatedData -_id -__v' 
  });

  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('all-crop', allCrops);
  res.status(200).json({
    success: true,
    message: "All crops that are available",
    crops: allCrops,
  });
});

  
exports.searchCrop = catchAsyncErrors(async (req, res) => {
    const query = {};    
    for (let key in req.query) {
      if (req.query[key]) {
        if (key === "cropId" || key === "name") {
          query[key] = { $regex: req.query[key], $options: "i" }; 
        }
      }
    }
  
    if (req.query.diseaseName) {
      
      const diseases = await Disease.find({
        name: { $regex: req.query.diseaseName, $options: "i" }, 
      }).select("diseaseId"); 
  
      if (diseases.length > 0) {
        const diseaseIds = diseases.map((d) => d.diseaseId); 
  
        query["stages.diseases"] = { $in: diseaseIds };
      } else {
        return res.json([]);
      }
    }
  
  
    const crops = await Crop.find(query);
  
    const cropsWithPopulatedDiseases = await Promise.all(
      crops.map(async (crop) => {
        const populatedStages = await Promise.all(
          crop.stages.map(async (stage) => {
            const diseases = await Disease.find({ diseaseId: { $in: stage.diseases } });
            return {
              ...stage.toObject(),
              diseases,
            };
          })
        );
  
        return {
          ...crop.toObject(),
          stages: populatedStages,
        };
      })
    );
    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('search-crop', cropsWithPopulatedDiseases);
    res.json(cropsWithPopulatedDiseases);
});
  

  
exports.updateCrop = catchAsyncErrors(async (req, res) => {   
  logger.info("updating crops");
  const { cropId } = req.params; // Extract cropId from request params
  const updateCropData = req.body; // Get the data to be updated from the request body
  const agent = await Agent.findById(req.user.id); // Get the agent making the update

  // Ensure agent exists
  if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
  }

  // Capture the full IP address from the request
  const ipAddress = req.headers['x-forwarded-for'] || req.ip;

  // Check if stages need to be updated or added
  if (updateCropData.stages) {
      const { stages } = updateCropData;
      for (const stage of stages) {
          if (stage._id) { // Check if _id is provided for updating existing stages
              // Update the specific stage by _id
              if (stage.diseases) {
                  for (const disease of stage.diseases) {
                      if (disease._id) {
                          // Update the specific disease by _id within the stage
                          await Crop.updateOne(
                              { cropId, "stages._id": stage._id, "stages.diseases._id": disease._id },
                              { $set: { "stages.$[stage].diseases.$[disease]": disease } },
                              { 
                                arrayFilters: [
                                  { "stage._id": stage._id },
                                  { "disease._id": disease._id }
                                ]
                              }
                          );
                      } else {
                          // Add new disease to the stage
                          await Crop.updateOne(
                              { cropId, "stages._id": stage._id },
                              { $push: { "stages.$.diseases": disease } }
                          );
                      }
                  }
              }
              // Update other fields of the stage
              await Crop.updateOne(
                  { cropId, "stages._id": stage._id },
                  { $set: { 
                      "stages.$.name": stage.name, 
                      "stages.$.stage": stage.stage, 
                      "stages.$.duration": stage.duration
                  }}
              );
          } else { // No _id provided, add as new stage
              await Crop.updateOne(
                  { cropId },
                  { $push: { stages: stage } } // Add new stage to stages array
              );
          }
      }
  }

  // Find the crop by cropId and update only the fields passed in the request body (excluding stages)
  const { stages: _, ...remainingUpdateData } = updateCropData; // Exclude stages from remaining update data
  const updatedCrop = await Crop.findOneAndUpdate(
      { cropId },  // Find the crop by its cropId
      { 
          $set: {
              ...remainingUpdateData,  // Use $set to only update the fields provided in updateCropData
              LastUpdated_By: agent.agentId, // Store the agentId of the updating agent
          },
          $push: {
              updatedData: {
                  updatedFields: remainingUpdateData, // Store the updated fields
                  updatedByEmail: agent.email,
                  updatedAt: Date.now(),
                  ipAddress,  // Store the full IP address
              },
          },
      },
      { new: true, runValidators: true }  // Return the updated document and run validators
  );

  if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found" });
  }

  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('update-crop', updatedCrop); // Emit event to all connected clients
  res.json({
      message: "Crop updated successfully",
      data: updatedCrop
  });
});


exports.deleteCrop = catchAsyncErrors(async (req, res) => {
    const { cropId } = req.params;
  logger.info(`Trying to Delete crop with this : ${cropId}`)
    // Find the customer lead by leadId and delete it
    const deletedCrop = await Crop.findOneAndDelete({ cropId });
  
    if (!deletedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    const io = req.app.get('socket.io'); // Get Socket.IO instance
    io.emit('delete-crop', deletedCrop); // Emit event to all connected clients
    res.json({ message: "Crop deleted successfully" });
});


exports.deleteStage = catchAsyncErrors(async (req, res) => {
  const { cropId, stageId } = req.params;
  logger.info(`Trying to delete stage with ID: ${stageId} from crop with ID: ${cropId}`);

  // Find the crop and pull the stage from the stages array
  const updatedCrop = await Crop.findOneAndUpdate(
      { cropId },
      { $pull: { stages: { _id: stageId } } },
      { new: true }
  );

  if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found or Stage not found" });
  }

  const io = req.app.get('socket.io'); // Get Socket.IO instance
  io.emit('delete-stage', { cropId, stageId }); // Emit event to all connected clients
  res.json({ message: "Stage deleted successfully", crop: updatedCrop });
});