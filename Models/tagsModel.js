const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
    name: { type: String, required: [true,"Tag Name is Required"] },
    create_at:Date,
    created_by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Agent"
    },
    updated_By:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Agent"
      },
});

const Tags= mongoose.model('Tags', tagsSchema);
module.exports = Tags