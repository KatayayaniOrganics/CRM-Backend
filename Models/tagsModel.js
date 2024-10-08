const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
    name: { type: String, required: [true,"Tag Name is Required"] },
    create_at:{type:Date,default:()=>new Date(Date.now() + 5.5 * 60 * 60 * 1000)},
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