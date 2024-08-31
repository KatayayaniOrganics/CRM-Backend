const Query = require("../Models/queryModel");
const CallDetails = require("../Models/callDetails");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");
const Disease = require("../Models/diseaseModel");
const logger = require("../logger");
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

exports.CallDetailsCreation = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on CallDeatails creation Route");

  const lastCall = await CallDetails.findOne().sort({ callId: -1 }).exec();

  let newCallId = "CO-1001";

  if (lastCall) {
    // Extract the numeric part of the callId
    const lastCallNumber = parseInt(lastCall.callId.split("-")[1], 10);

    // Increment and create the new callId
    const newCallNumber = lastCallNumber + 1;

    // Ensure the numeric part is padded to the correct length
    newCallId = `CO-${newCallNumber.toString().padStart(2, "0")}`;
  }

  const callDetails = new CallDetails({
    ...req.body,
    callId: newCallId,
  });

  await callDetails.save();
  res
    .status(201)
    .send({ success: true, message: "CallDetails created successfully" });
  logger.info(callDetails);
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
