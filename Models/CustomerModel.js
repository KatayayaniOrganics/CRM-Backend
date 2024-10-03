const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      ref: "Lead",
    },
    customerId: {
      type: String,
      unique: true,
      default: "CT-1000",   
    },
    firstName: {
      type: String,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      default: null,
      required: [true, "Last Name is required"],
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      default: null, 
      required: [true, "Email is required"],
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
      required: [true, "Address is required"],
    },
    address2: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
      required: [true, "City is required"],
    },
    State: {
      type: String,
      default: null, 
      required: [true, "State is required"],
    },
    country: {
      type: String,
      default: null, 
      required: [true, "Country is required"],
    },
    countryCode:{
      type:String,
      default:null,
      required: [true, "Country Code is required"],
    },
    number: {
      type: Number,
      unique: true,
      required: [true, "Contact is required"],
      minLength: [10, "Contact should be at least 10 numbers"],
      maxLength: [13, "Contact should be at most 13 numbers"],
    },
    GST_Number:{
      type:String,
      default:null,
    },
    status:{
      type:String,
      enum:["Active","Inactive"],
      default:"Active",
    },
    Tags:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Tags",
    },
    call_history:[
      {
        callId:{type:String,ref:"Calls"}
      }
    ],
    order_history: [
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, 
      },
    ],
    updatedData: [
      {
        updatedBy: { type: String, ref: "Agents"}, // Using agentId instead of ObjectId
        updatedByEmail:{type:String},
        updatedFields: { type: Object },
        ipAddress:{type:String},
        updatedAt: { type: Date, default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000)},
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

const Customer = mongoose.model("Customer", CustomerSchema);

module.exports = Customer;
