const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const logger = require("../logger");
const Tags = require("../Models/tagsModel");

exports.createTags = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST )Request on Tags creation Route");
  
    const { name } = req.body;
    const tag = new Tags({ name });
    await tag.save();
    res.status(201).send({ success: true, message: "Tags Created successfully" });
    logger.info(tag);
  });