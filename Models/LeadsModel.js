const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      default: "K0-1000", 
    },
    leadOwner: {
      type: String,
      default: 'Katyayani', 
    },
    firstName: {
      type: String,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      default: null, 
      match: [
        /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    cast: {
      type: String,
      default: null, 
    },
    address1: {
      type: String,
      default: null, 
    },
    address2: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null, 
    },
    State: {
      type: String,
      default: null, 
    },
    country: {
      type: String,
      default: null, 
    },
    responded_at: {
      type: Date,
      default: null, 
    },
    last_active: {
      type: Date,
      default: null, 
    },
    lead_category: {
      type: String,
      default: null, 
    },
    countryCode:{
      type:String,
      default:null,
    },
    contact: {
      type: String,
      unique: true,
      required: [true, "Contact is required"],
      minLength: [10, "Contact should be at least 10 numbers"],
      maxLength: [13, "Contact should be at most 13 numbers"],
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source", 
    },
    created_at: {
      type: Date,
      default: Date.now, 
    },
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query", 
    },
    order_history: [
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, 
      },
    ],
    farm_details: {
      area: {
        type: String,
        default: null, 
      },
      crops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Crop" }], 
    },
    call_history: [{ type: mongoose.Schema.Types.ObjectId, ref: "CallDetails" }], 
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tags" }],
    updatedData: [
      {
        updatedBy: { type: String, ref: "Agents"}, // Using agentId instead of ObjectId
        updatedByEmail:{type:String},
        updatedFields: { type: Object },
        ipAddress:{type:String},
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    LastUpdated_By: {
      type: String, // Use agentId here
      ref: "Agents", // Reference the Agent schema using agentId
    },
    // For additional fields that may be added dynamically
    additionalFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const Leads = mongoose.model("Leads", LeadsSchema);

module.exports = Leads;
