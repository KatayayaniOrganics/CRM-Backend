var mongoose = require('mongoose');
const logger = require('../logger');

exports.connectDatabase = async () =>{
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    logger.info("Connection established to Database")
  } catch(error){
     logger.error("not found")
  };
  
}
  

