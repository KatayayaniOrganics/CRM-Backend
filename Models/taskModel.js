const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
   task_id: { type: String, default: "T-1000" },
   task_name: { type: String, required: [true,"Task Name is Required"] },
   task_description: { type: String, required: [true,"Task Description is Required"] },
   task_status: { type: String, enum:["Open","Completed"],default:"Open" },
   task_priority: { type: String,enum:["High","Medium","Low"],default:"High" },
   task_due_date: { type: Date, required: [true,"Task Due Date is Required"] },
   task_created_by: { type: String, ref: "Agents" },
   updatedData: [
    {
      updatedBy: { type: String, ref: "Agents"}, // Using agentId instead of ObjectId
      updatedByEmail:{type:String},
      updatedFields: { type: Object },
      ipAddress:{type:String},
      updatedAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000) // Adds 5.5 hours to UTC
      },
    },
  ],
  LastUpdated_By: {
    type: String, // Use agentId here
    ref: "Agents", // Reference the Agent schema using agentId
  }
});

// Pre-save hook to generate a custom task ID
taskSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastTask = await mongoose.model('Tasks').findOne().sort({ task_id: -1 }).exec();
        const lastId = lastTask ? parseInt(lastTask.task_id.substring(2)) : 1000;
        this.task_id = `T-${lastId + 1}`;
    }
    next();
});

const Tasks= mongoose.model('Tasks', taskSchema);
module.exports = Tasks