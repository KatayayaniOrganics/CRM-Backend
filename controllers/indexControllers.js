const Query = require("../Models/queryModel");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");
const Disease = require("../Models/diseaseModel");
const logger = require("../logger");
const UserRoles = require("../Models/userRolesModel");
const Agent = require("../Models/agentModel");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");

exports.queryCreation = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Query creation Route");

  const {
    customer_id,
    query_category,
    order,
    tags,
    reason_not_ordered,
    description,
    created_by,
  } = req.body;
  const query = new Query({
    customer_id,
    query_category,
    order,
    tags,
    reason_not_ordered,
    description,
    created_by,
  });
  await query.save();

  res
    .status(201)
    .send({ success: true, message: "Query created successfully" });
  logger.info(query);
});


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
  const { cropId } = req.params;
  const updateCropData = req.body;
  const agentId = req.user.id;
  // console.log(agentId)

 
  updateCropData.updatedBy = agentId;

  const updatedCrop = await Crop.findOneAndUpdate({ cropId }, updateCropData, {
    new: true,
    runValidators: true,
  });

  if (!updatedCrop) {
    return res.status(404).json({ message: "Crop not found" });
  }

  res.json(updatedCrop);
  console.log(updatedCrop);
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
  const updateDiseaseData = req.body;
  const agentId = req.user.id;
  // console.log(agentId)

 
  updateDiseaseData.updatedBy = agentId;

  
  const updatedDisease = await Disease.findOneAndUpdate({ diseaseId }, updateDiseaseData, {
    new: true,
    runValidators: true,
  });

  if (!updatedDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }

  res.json(updatedDisease);
  console.log(updatedDisease);
});

exports.deleteDisease = catchAsyncErrors(async (req, res) => {
  const { diseaseId } = req.params;

 
  const deletedDisease = await Disease.findOneAndDelete({ diseaseId });

  if (!deletedDisease) {
    return res.status(404).json({ message: "Disease not found" });
  }

  res.json({ message: "Disease deleted successfully" });
});

exports.createSource = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Source creation Route");

  if (Array.isArray(req.body)) {
    const sources = await Source.insertMany(req.body);
    // await sources.save();
    res
      .status(201)
      .send({ success: true, message: "Sources Created in Bulk successfully" });
    logger.info(sources);
  } else {
    const source = new Source(req.body);
    await source.save();
    res
      .status(201)
      .send({ success: true, message: "Sources Created successfully" });
    logger.info(source);
  }
});

exports.createTags = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST )Request on Tags creation Route");

  const { name } = req.body;
  const tag = new Tags({ name });
  await tag.save();
  res.status(201).send({ success: true, message: "Tags Created successfully" });
  logger.info(tag);
});

exports.CreateUserRoles = catchAsyncErrors(async (req, res) => {
  const { role_name, level } = req.body;

  if (level <= 1) {
    return res
      .status(400)
      .json({ message: "You cannot create roles with level 1" });
  }
  const lastUserRoles = await UserRoles.findOne()
    .sort({ UserRoleId: -1 })
    .exec();

  let newUserRoleId = "USR-1000"; // Default starting ID

  if (lastUserRoles) {
    // Extract the numeric part from the last leadId and increment it
    const lastUserRolesNumber = parseInt(
      lastUserRoles.UserRoleId.split("-")[1]
    );
    newUserRoleId = `USR-${lastUserRolesNumber + 1}`;
  }
  // Create the new role
  const newRole = new UserRoles({
    role_name,
    level,
    UserRoleId: newUserRoleId,
  });
  await newRole.save();
  res.status(201).json({ message: "User role created successfully", newRole });
});

exports.getAlluserRoles = catchAsyncErrors(async (req, res) => {
  const userRoles = await UserRoles.find();
  res.status(200).json(userRoles);
});

exports.updateUserRole = catchAsyncErrors(async (req, res) => {
  const { agentId, newRoleId } = req.body;

  // Find the new role
  const newRole = await UserRoles.findById(newRoleId);
  if (!newRole) {
    return res.status(404).json({ success: false, message: "Role not found" });
  }

  // Find the agent and update the user_role
  const agent = await Agent.findByIdAndUpdate(
    agentId,
    {
      user_role: newRole._id,
    },
    { new: true }
  ); // `new: true` returns the updated agent

  if (!agent) {
    return res.status(404).json({ success: false, message: "Agent not found" });
  }

  res
    .status(200)
    .json({ success: true, message: "User role updated successfully", agent });
});
