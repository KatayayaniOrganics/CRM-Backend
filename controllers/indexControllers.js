const Query = require("../Models/queryModel");
const CallDetails = require("../Models/callDetails");
const Crop = require("../Models/cropModel");
const Source = require("../Models/sourceModel");
const Tags = require("../Models/tagsModel");
const logger = require("../logger");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");


exports.queryCreation = catchAsyncErrors(async (req, res) => {
     logger.info("You made a POST Request on Query creation Route")
  
        const { customer_id, query_category, order, tags, reason_not_ordered, description, created_by } = req.body;
        const query = new Query({ customer_id, query_category, order, tags, reason_not_ordered, description, created_by });
        await query.save();
      
        res.status(201).send({ success: true, message: 'Query created successfully' });
        logger.info(query)
   
  });
  exports.CallDetailsCreation = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on CallDeatails creation Route")

   

        const { query_id, customer_id, agent_id, datetime, duration, reason_not_connected } = req.body;
        const callDetails = new CallDetails({ query_id, customer_id, agent_id, datetime, duration, reason_not_connected });
        await callDetails.save();
        res.status(201).send({ success: true, message: 'CallDetails created successfully' });
        logger.info(callDetails)
        
    
  });

  exports.CropsCreation=catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST Request on Crops creation Route")

    
        const { name, sowing, products_used, crop_stage } = req.body;
        const crop = new Crop({ name, sowing, products_used, crop_stage });
        await crop.save();
        res.status(201).send({ success: true, message: 'Crop created successfully' });
        logger.info(crop)
5 
   

  });

  
exports.createSource = catchAsyncErrors(async (req, res) => {
  logger.info("You made a POST Request on Source creation Route")


      if(Array.isArray(req.body)){

        const sources = await Source.insertMany(req.body);
        // await sources.save();
        res.status(201).send({ success: true, message: 'Sources Created in Bulk successfully' });
        logger.info(sources)
      }
      else{
        const source = new Source(req.body);
        await source.save();
        res.status(201).send({ success: true, message: 'Sources Created successfully' });
        logger.info(source)
      }
   
  });
  
  exports.createTags = catchAsyncErrors(async (req, res) => {
    logger.info("You made a POST )Request on Tags creation Route")

 
      const { name } = req.body;
      const tag = new Tags({ name });
      await tag.save();
      res.status(201).send({ success: true, message: 'Tags Created successfully' });
      logger.info(tag)
   
  });
  

  

