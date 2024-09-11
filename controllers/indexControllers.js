const Query = require("../Models/queryModel");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");
const Disease = require("../Models/diseaseModel");
const logger = require("../logger");
const UserRoles = require('../Models/userRolesModel');
const Agent = require("../Models/agentModel")
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
    // Extract the numeric part of the cropId
    const lastCropNumber = parseInt(lastCrop.cropId.split("-")[1], 10);

    // Increment and create the new cropId
    const newCropNumber = lastCropNumber + 1;

    // Ensure the numeric part is padded to the correct length
    newCropId = `CS-${newCropNumber.toString().padStart(2, "0")}`;
  }

  const crop = new Crop({
    ...req.body,
    cropId: newCropId,
  });

  const disease = new Disease(req.body);
  const diseaseId = disease.id;
  crop.diseases.push(diseaseId);
  await disease.save();
  await crop.save();

  res.status(201).send({ success: true, message: "Crop created successfully" });
  logger.info(crop);
});

exports.searchCrop = catchAsyncErrors(async (req, res) => {
  const query = {};

  // Loop through the query parameters and add them to the search query
  for (let key in req.query) {
    if (req.query[key]) {
      if (key === "cropId" || key === "name") {
        query[key] = { $regex: req.query[key], $options: "i" }; // Case-insensitive partial match
      }
    }
  }

  // If the user searches by disease name
  if (req.query.diseaseName) {
    const diseases = await Disease.find({
      diseaseName: { $regex: req.query.diseaseName, $options: "i" }, // Case-insensitive partial match
    }).select("_id"); // Get only the IDs of the matching diseases

    // Add a condition to search crops with the found disease IDs
    query.diseases = { $in: diseases };
  }

  const crops = await Crop.find(query).populate("diseases"); // Populate the diseases field
  res.json(crops);
});


exports.updateCrop = catchAsyncErrors(async (req, res) => {
  const { cropId } = req.params;
  const updateCropData = req.body;
  const agentId = req.user.id;  
  // console.log(agentId)

    // Add the user who is updating the crop to the update data
    updateCropData.updatedBy = agentId;   

    // Find the customer lead by leadId and update it
    const updatedCrop = await Crop.findOneAndUpdate(
      { cropId },
      updateCropData,
      { new: true, runValidators: true }
    );

    if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    res.json(updatedCrop);
    console.log(updatedCrop); 
    
})

exports.deleteCrop = catchAsyncErrors(async (req, res) => {
  const { cropId } = req.params;

  // Find the customer lead by leadId and delete it
  const deletedCrop = await Crop.findOneAndDelete({ cropId });

  if (!deletedCrop) {
    return res.status(404).json({ message: "Crop not found" });
  }

  res.json({ message: "Crop deleted successfully" });
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
    return res.status(400).json({ message: 'You cannot create roles with level 1' });
  }
  const lastUserRoles = await UserRoles.findOne().sort({ UserRoleId: -1 }).exec();

 let newUserRoleId = "USR-1000"; // Default starting ID

 if (lastUserRoles) {
   // Extract the numeric part from the last leadId and increment it
   const lastUserRolesNumber = parseInt(lastUserRoles.UserRoleId.split("-")[1]);
   newUserRoleId = `USR-${lastUserRolesNumber + 1}`;
 }
    // Create the new role
    const newRole = new UserRoles({ role_name, level , UserRoleId:newUserRoleId });
    await newRole.save();
    res.status(201).json({ message: 'User role created successfully', newRole });
  
});


exports.getAlluserRoles =catchAsyncErrors(async (req, res) => {
  
  const userRoles = await UserRoles.find();
  res.status(200).json(userRoles);

});


exports.updateUserRole = catchAsyncErrors(async (req, res) => {
  const { agentId, newRoleId } = req.body;

  // Find the new role
  const newRole = await UserRoles.findById(newRoleId);
  if (!newRole) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }

  // Find the agent and update the user_role
  const agent = await Agent.findByIdAndUpdate(agentId, {
    user_role: newRole._id
  }, { new: true }); // `new: true` returns the updated agent

  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }

  res.status(200).json({ success: true, message: 'User role updated successfully', agent });
});
