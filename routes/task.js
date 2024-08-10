const mongoose = require('mongoose');


const taskSchema = new mongoose.Schema({
  taskOwner: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  contact: {
    type:Number,
    required:true // Assuming there is a Contact collection
  },
  reminder: {
    type: Date,
  },
  entityId: {
    type: String,
  },
  customer: {
    type:String,
    required:true// Assuming there is a Customer collection
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'], // Example status values
    default: 'Not Started',
  },
  statusChangedTime: {
    type: Date,
  },
  callAttempt: {
    type: Number,
    default: 0,
  },



  timestampCompletion: {
    type: Date,
  },
  repeat: {
    type: Boolean,
    default: false,
  },
  kylasTaskId: {
    type: String,
  },
  taskType: {
    type: String,
  },
    pipelineStage: {
      type: String,
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entity', // Assuming there is an Entity collection
    },
    associatedName: {
      type: String,
    },
    associatedContactNumber: {
      type: String,
    },

  dynamicFields: {
    type: mongoose.Schema.Types.Mixed, // Can be an object with any structure
  },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
