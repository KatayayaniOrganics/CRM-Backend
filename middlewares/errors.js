const logger = require("../logger");

module.exports = (err,req,res,next) => {
 
    const statusCode = err.statusCode ||500;
    if(err.name === 'MongoServerError' && err.message.includes("E11000 duplicate key")){
        err.message= 'Agent with Already Exists please try with different details';
        logger.warn(err.message);  
    }
    if(err.name === 'ValidationError' && err.message.includes("First Name is required")){
        err.message= 'First Name is required';
        logger.warn(err.message);

    }
    if(err.name === 'ValidationError' && err.message.includes("Last Name is required")){
        err.message= 'Last Name is required';
        logger.warn(err.message);

    }
    if(err.name === 'ValidationError' && err.message.includes("Last Name should be at least 3 characters long")){
        err.message= 'Last Name should be at least 3 characters long';
        logger.warn(err.message);

    }
    if(err.name === 'ValidationError' && err.message.includes("Email Address is Required")){
        err.message= 'Please Provide Email Address'
        logger.warn(err.message);
    }
    res.status(statusCode).json({
        message:err.message,
        errName:err.name,
        statusCode
        // stack:err.stack, 
    })


}