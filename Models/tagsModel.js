const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
    name: { type: String, required: [true,"Tag Name is Required"] },
    create_at:Date,
    created_by:String
});

const Tags= mongoose.model('Tags', tagsSchema);
module.exports = Tags