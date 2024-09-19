var mongoose = require('mongoose');
const logger = require('../logger');

exports.connectDatabase = async () =>{
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`);
    logger.info(`Connection established to Database !!`);
    logger.info(`DB HOST:${connectionInstance.connection.host}`);
  } catch(error){
     logger.error("MongoDb Connection Failed:",error);
     process.exit(1);
  };
}
  

