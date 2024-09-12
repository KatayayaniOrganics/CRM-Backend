const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    utm_content: String,
    utm_campaign: String,
    updated_By:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Agent"
      },
});

const Source = mongoose.model('Source', sourceSchema);
module.exports = Source;