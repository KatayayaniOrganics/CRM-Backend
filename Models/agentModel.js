var mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  firstname: { type: String, 
    required: [true, "First Name is required"], 
    trim: true,
    minLength:[3,"First Name should be atleast 4 character long"]
   },
  lastname: { type: String, 
    required: [true, "Last Name is required"],
    trim: true,
    minLength:[4,"First Name should be atleast 4 character long"]
   },
  email: { type: String, 
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
   ],
    unique: true ,
  },
  password: { type: String, 
    select: false,
    required: [true, "Password required"],
    maxLength: [15, 'Password Should not be exceed more than 15 characters'],
    minLength: [6, 'Password Should have atleast 6 characters'],
  },
  address: { type: String ,required: [true, "Address is required"] },
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
