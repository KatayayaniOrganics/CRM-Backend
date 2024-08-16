var mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  user_role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserRoles",
  }, // Reference to UserRoles
  call_history: [
      {
          call_id: { type: mongoose.Schema.Types.ObjectId, ref: "CallDetails" },
        },
    ],
    talktime_day: Number,
    total_talktime: Number,
    breaktime_day: Number,
    total_breaktime: Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

const Agents = mongoose.model("Agents", agentSchema);
module.exports = Agents;
