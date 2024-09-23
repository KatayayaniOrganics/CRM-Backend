const Crop = require("../Models/cropModel");            
const logger = require("../logger");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Disease = require("../Models/diseaseModel");                  
            
exports.CropsCreation = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Crops creation Route");
    const lastCrop = await Crop.findOne().sort({ cropId: -1 }).exec();
  
    let newCropId = "CS-01";
    if (lastCrop) {
      const lastCropNumber = parseInt(lastCrop.cropId.split("-")[1], 10);
      const newCropNumber = lastCropNumber + 1;
      newCropId = `CS-${newCropNumber.toString().padStart(2, "0")}`;
    }
  
    const stages = req.body.stages; 
    const cropStages = [];
  
    for (let stage of stages) {
      const diseaseIds = stage.diseases; 
  
        await disease.save();
        diseaseIds.push(disease._id);
  
      
      logger.info(`Received disease IDs for stage '${stage.name}': ${diseaseIds.join(", ")}`);
  
      
      const foundDiseases = await Disease.find({ diseaseId: { $in: diseaseIds } });
      const validDiseaseIds = foundDiseases.map(disease => disease.diseaseId);
  
    
      const invalidDiseaseIds = diseaseIds.filter(id => !validDiseaseIds.includes(id));
      if (invalidDiseaseIds.length > 0) {
        logger.warn(`Invalid diseaseIds provided for stage '${stage.name}': ${invalidDiseaseIds.join(", ")}`);
      }
  
      cropStages.push({
        name: stage.name, 
        stage: stage.stage,
        duration: stage.duration,
        diseases: validDiseaseIds, 
      });
  
      
      logger.info(`Storing valid disease IDs for stage '${stage.name}': ${validDiseaseIds.join(", ")}`);
    }
  
    const crop = new Crop({
      ...req.body,
      cropId: newCropId,
      cropImage: req.body.cropImage,
      stages: cropStages,
    });
  
    await crop.save();
  
    res.status(201).send({ success: true, message: "Crop created successfully", crop });
    logger.info(crop);
  });
  
  exports.allCrops = catchAsyncErrors(async (req, res) => {
  
    const allCrops = await Crop.find();
  
  
    const cropsWithPopulatedDiseases = await Promise.all(
      allCrops.map(async (crop) => {
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
  
    res.status(200).json({
      success: true,
      message: "All crops that are available",
      crops: cropsWithPopulatedDiseases,
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
  
    res.json(cropsWithPopulatedDiseases);
  });
  
  exports.updateCrop = catchAsyncErrors(async (req, res) => {
    const { cropId } = req.params; // Extract cropId from request params
    const updateCropData = req.body; // Get the data to be updated from the request body
    const agentId = req.user.id; // Get the agentId of the user making the update
  
    // Add the agentId to updatedBy field to track who made the update
    updateCropData.updatedBy = agentId;
  
    // Find the crop by cropId and update only the fields passed in the request body
    const updatedCrop = await Crop.findOneAndUpdate(
      { cropId },  // Find the crop by its cropId
      { $set: updateCropData },  // Use $set to only update the fields provided in updateCropData
      { new: true, runValidators: true }  // Return the updated document and run validators
    );
  
    if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }
  
    res.json({
      message: "Crop updated successfully",
      data: updatedCrop
    });
  });
  
  exports.deleteCrop = catchAsyncErrors(async (req, res) => {
    const { cropId } = req.params;
  
    // Find the customer lead by leadId and delete it
    const deletedCrop = await Crop.findOneAndDelete({ cropId });
  
    if (!deletedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }
  
    res.json({ message: "Crop deleted successfully" });
  });
  