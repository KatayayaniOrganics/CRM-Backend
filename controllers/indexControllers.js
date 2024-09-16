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
  const { description, query_category, order, tags, reason_not_ordered, created_by, updated_By } = req.body;

  // Check if description is provided (customer_id will be generated automatically)
  if (!description) {
      return res.status(400).json({
          success: false,
          message: 'Description is required',
      });
  }

  const lastQuery = await Query.findOne().sort({ created_at: -1 });

  let newCustomerId = "Qu101";
  if (lastQuery && lastQuery.customer_id) {
      const lastCustomerIdNumber = parseInt(lastQuery.customer_id.slice(2)) + 1;
      newCustomerId = `Qu${lastCustomerIdNumber}`;
  }

  // Create the new query with the generated customer_id
  const newQuery = await Query.create({
      customer_id: newCustomerId, // Generated customer ID
      description,                // Required
      query_category,             // Optional
      order,                      // Optional
      tags,                       // Optional
      reason_not_ordered,         // Optional
      created_by,                 // Optional
      updated_By                  // Optional
  });

  res.status(201).json({
      success: true,
      message: 'Query created successfully',
      query: newQuery
  });
});

exports.getQuery = catchAsyncErrors(async (req, res) => {
    const { customer_id } = req.query;

    // If customer_id is provided, return the specific query
    if (customer_id) {
        const query = await Query.findOne({ customer_id });

        // If the query is not found, return 404
        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found for the given customer ID',
            });
        }

        // Return the specific query
        return res.status(200).json({
            success: true,
            query,
        });
    }

    // If no customer_id is provided, return all queries
    const queries = await Query.find();

    // If no queries exist, return 404
    if (queries.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No queries found',
        });
    }

    // Return all queries
    res.status(200).json({
        success: true,
        queries,
    });
});

exports.deleteQuery = catchAsyncErrors(async (req, res) => {
  // Log the incoming request
  console.log('Request query:', req.query);

  // Destructure the customer_id from req.query
  const { customer_id } = req.query;

  // Check if customer_id exists
  if (!customer_id) {
      return res.status(400).json({
          success: false,
          message: 'Customer ID must be provided to delete a query',
      });
  }

  // Attempt to find and delete the query by customer_id
  const query = await Query.findOneAndDelete({ customer_id });

  // If no query is found, return a 404 error
  if (!query) {
      return res.status(404).json({
          success: false,
          message: 'Query not found for the given customer ID',
      });
  }

  // If successfully deleted, return a success response
  return res.status(200).json({
      success: true,
      message: 'Query successfully deleted',
  });
});

exports.updateQuery = catchAsyncErrors(async (req, res) => {
  const { customer_id } = req.query;

  // Check if customer_id is provided
  if (!customer_id) {
      return res.status(400).json({
          success: false,
          message: 'Customer ID must be provided to update a query',
      });
  }

  // Check if request body contains any updates
  const updateData = req.body;
  if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
          success: false,
          message: 'Update data must be provided',
      });
  }

  // Find the query by customer_id and update it
  const query = await Query.findOneAndUpdate(
      { customer_id },  // Find by customer_id
      updateData,       // Data to update
      { new: true, runValidators: true }  // Return the updated document, and apply schema validation
  );

  // If the query is not found, return a 404 error
  if (!query) {
      return res.status(404).json({
          success: false,
          message: 'Query not found for the given customer ID',
      });
  }

  // Return the updated query
  return res.status(200).json({
      success: true,
      message: 'Query successfully updated',
      query,
  });
});

exports.CropsCreation = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Crops creation Route");

  // Fetch the last created crop to increment the ID
  const lastCrop = await Crop.findOne().sort({ cropId: -1 }).exec();

  let newCropId = "CS-01";
  if (lastCrop) {
    const lastCropNumber = parseInt(lastCrop.cropId.split("-")[1], 10);
    const newCropNumber = lastCropNumber + 1;
    newCropId = `CS-${newCropNumber.toString().padStart(2, "0")}`;
  }

  const stages = req.body.stages; // Fetch stages from the request body
  const cropStages = [];

  // Loop through each stage and create diseases dynamically
  for (let stage of stages) {
    const diseaseIds = [];
    for (let diseaseData of stage.diseases) {
      const disease = new Disease({
        diseaseName: diseaseData.name,
        diseaseImage: diseaseData.image,
        solution: diseaseData.solutions,
        prevention: diseaseData.prevention,
        products: diseaseData.products,
      });

      await disease.save();
      diseaseIds.push(disease._id); // Add the saved disease ID to the stage
    }

    // Add the dynamically created diseases to each stage
    cropStages.push({
      name: stage.Name,
      stage: stage.stage,
      duration: stage.duration,
      diseases: diseaseIds,
    });
  }

  // Create the new crop with dynamic stages
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

  const allCrops = await Crop.find().populate({
    path: 'stages.diseases', 
    model: 'Disease',
  });

  res.status(200).json({
    success: true,
    message: "All Crops that are available",
    allCrops,
  });
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
    // Find disease IDs that match the search criteria
    const diseases = await Disease.find({
      diseaseName: { $regex: req.query.diseaseName, $options: "i" }, // Case-insensitive partial match
    }).select("_id"); // Get only the IDs of the matching diseases

    if (diseases.length > 0) {
      const diseaseIds = diseases.map(d => d._id);

      // Add a condition to search crops where any stage's diseases field contains the found disease IDs
      query['stages.diseases'] = { $in: diseaseIds };
    } else {
      // If no diseases are found, return an empty array
      return res.json([]);
    }
  }

  // Fetch crops and populate the diseases in the stages array
  const crops = await Crop.find(query).populate({
    path: 'stages.diseases', // Path to populate nested diseases within stages
    model: 'Disease',        // Model name of Disease
  });

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
