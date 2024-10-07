const Source = require("../Models/sourceModel");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const logger = require("../logger");

exports.createSource = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Source creation Route");
    logger.info(`Creating new source from IP: ${req.ip}`);
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
  