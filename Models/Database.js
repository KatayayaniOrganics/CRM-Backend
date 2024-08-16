var mongoose = require('mongoose');

exports.connectDatabase = async () =>{
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connection established")
  } catch(error){
     console.log("not found")
  };
  
}
  

