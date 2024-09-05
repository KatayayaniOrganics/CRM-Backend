const mongoose = require("mongoose");

const customerLeadSchema = new mongoose.Schema(
  {
    leadId:{
      type: String,
      unique:true,
      default:"K0-1000",
    },
    leadOwner: {
      type: String,
      minLnegth: [3, "LeadOwner shuold be atleast 3 character long"],
    },
    firstName: {
      type: String,
      required: [true, "First Name is required"],
      minLnegth: [3, "First Name shuold be atleast 3 character long"],
    },
    lastName: {
      type: String,
      minLnegth: [3, "Second Name shuold be atleast 3 character long"],
    },
    email: {
      type: String,
      unique:true,
      match: [
        /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    cast:String,
    address1: String,
    address2: String,
    city:String,
    State:String,
    country:String,
    responded_at: Date,
    last_active:Date,
    lead_category: String,
    contact: { type: String,
      unique:true ,
      required: [true, "Contact is required"],
      minLnegth: [10, "Contact shuold be atleast 10 number"],
      maxLnegth: [13, "Contact shuold be atmost 13 number"] },
    source: { type: mongoose.Schema.Types.ObjectId, ref: "Source" },
    created_at: { type: Date, default: Date.now },
    query: { type: mongoose.Schema.Types.ObjectId, ref: "Query" },
    
    order_history: [
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      },
    ],
    farm_details: {
      area: String,
      crops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Crop" }],
    },
    call_history: [{type: mongoose.Schema.Types.ObjectId, ref: "CallDetails"}],

    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tags" }],

    // For additional fields that may be added dynamically
    additionalFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const CustomerLead = mongoose.model("CustomerLead", customerLeadSchema);

module.exports = CustomerLead;