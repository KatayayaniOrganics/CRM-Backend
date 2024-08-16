const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    utm_content: String,
    utm_campaign: String
});

const Source = mongoose.model('Source', sourceSchema);
module.exports = Source;