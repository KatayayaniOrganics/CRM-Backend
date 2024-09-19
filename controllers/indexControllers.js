const Query = require("../Models/queryModel");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");
const Disease = require("../Models/diseaseModel");
const logger = require("../logger");
const UserRoles = require("../Models/userRolesModel");
const Agent = require("../Models/agentModel");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const { messaging } = require("firebase-admin");

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

    if (customer_id) {
        const query = await Query.findOne({ customer_id });

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found for the given customer ID',
            });
        }
        
        return res.status(200).json({
            success: true,
            query,
        });
    }

    const queries = await Query.find();
    if (queries.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No queries found',
        });
    }

    res.status(200).json({
        success: true,
        queries,
    });
});

exports.deleteQuery = catchAsyncErrors(async (req, res) => {

  console.log('Request query:', req.query);


  const { customer_id } = req.query;

  if (!customer_id) {
      return res.status(400).json({
          success: false,
          message: 'Customer ID must be provided to delete a query',
      });
  }
  const query = await Query.findOneAndDelete({ customer_id });

  if (!query) {
      return res.status(404).json({
          success: false,
          message: 'Query not found for the given customer ID',
      });
  }

  return res.status(200).json({
      success: true,
      message: 'Query successfully deleted',
  });
});

exports.updateQuery = catchAsyncErrors(async (req, res) => {
  const { customer_id } = req.query;
  const updateData = req.body;

  if (!customer_id || Object.keys(updateData).length === 0) {
      return res.status(400).json({
          success: false,
          message: 'Customer ID and update data are required',
      });
  }

  let query = await Query.findOne({ customer_id });
  if (!query) {
      return res.status(404).json({
          success: false,
          message: 'Query not found for the given customer ID',
      });
  }

  query.updated_history.push({
      updated_at: new Date(),
      updated_data: updateData,
      updated_by: req.body.updated_By
  });

  Object.assign(query, updateData);
  await query.save();

  return res.status(200).json({
      success: true,
      message: 'Query successfully updated',
      query
  });
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

// Role creation logic, controlled by Super Admin or Admin
exports.createRole = catchAsyncErrors(async (req, res) => {
  const { role_name } = req.body;

  const agent = await Agent.findById(req.user.id)
  if (agent.user_role) {
    const userRole = await UserRoles.findOne({ UserRoleId: agent.user_role }).select('UserRoleId  role_name');
    agent.user_role = userRole;  // Replace with the populated user role
  }

    // Check if the user is an Admin and trying to create a Super Admin role
    if (agent.user_role.role_name === "Admin" && role_name === "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Admins are not allowed to create the Super Admin role"
      });
    }

    // If Super Admin, prevent creating another Super Admin
    if (agent.user_role.role_name === "Super Admin" && role_name === "Super Admin") {
      const existingSuperAdmin = await UserRoles.findOne({ role_name: "Super Admin" });
      if (existingSuperAdmin) {
        return res.status(400).json({ success: false, message: "Super Admin role already exists" });
      }
    }
  const lastUserRoles = await UserRoles.findOne().sort({ UserRoleId: -1 }).exec();

  let newUserRoleId = "USR-1000"; // Default starting ID
 
  if (lastUserRoles) {
    // Extract the numeric part from the last leadId and increment it
    const lastUserRolesNumber = parseInt(lastUserRoles.UserRoleId.split("-")[1]);
    newUserRoleId = `USR-${lastUserRolesNumber + 1}`;
  }
  // Create a new role
  const newRole = new UserRoles({
    role_name,
    UserRoleId:newUserRoleId
  });

  await newRole.save();

  res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: newRole
  });
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
