const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      default: "K0-1000",
    },
    leadOwner: {
      agentId:{type:String,default:null},
      agentRef:{type:mongoose.Schema.Types.ObjectId,ref:'Agents',default:null}
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
  
    pinCode:{
      type:String,
      default:null
    },
    tehsil:{
      type:String,
      default:null
    },
    district:{
      type:String,
      default:null
    },
    talukka:{
      type:String,
      default:null
    },
    post:{
      type:String,
      default:null
    },
    gram:{
      type:String,
      default:null
    },
    contact: {
      type: String,
      unique: true,
      required: [true, "Contact is required"],
      minLength: [10, "Contact should be at least 10 numbers"],
      maxLength: [13, "Contact should be at most 13 numbers"],
    },
    countryCode: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      ref: "Source", 
    },
    created_at: {
      type: Date,
      default: Date.now, 
    },
    query: [
      {
        queryId:{type:String,default:null},
        queryRef:{type:mongoose.Schema.Types.ObjectId,ref:'Query',default:null}
        }
    ],
    order_history: [
      {
        order: { 
          type: String, 
          ref: "Order",
          default:null,
         }, 
      },
    ],
    farm_details: {
      farm_name: { type: String, default: null },
      area: { type: String,default: null },
      farm_unit: { type: String, default: null },
      Crop_name: [
        {crop_id: { type: String, default: null }, crop_name:{type: String, default: null }},
      ],
      showing_date: { type: Date, default: null },
      day_after_showing: { type: Date, default: null },
      expected_quntity:{ type: Date, default: null },
      sell_unit: { type: Date, default: null },
      unit_selling_price: { type: Date, default: null },
    },

    call_history: [
           {
        callID:{type:String,default:null},
        callDate:{type:Date,default:null}
      },
   
    ], 
    tags: [{ type: String, ref: "Tags",default:null }],
    updatedData: [
      {
        updatedBy: { type: String, ref: "Agents",default:null}, // Using agentId instead of ObjectId
        updatedByEmail:{type:String},
        updatedFields: { type: Object },
        ipAddress:{type:String},      
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    LastUpdated_By: {
      type: String, // Use agentId here
      ref: "Agents", // Reference the Agent schema using agentId
      default:null,
    },

    LeadStatus:{
      status:{
        type:String,
      enum:['Active','Inactive'],
      default:'Inactive',
    },
      LastUpdated:{type:Date,default:Date.now},
    },
    callStatus: [{ 
      status:{type: String, enum: ['Answered', 'Not Answered', 'Busy', 'Not Reachable'],default:null},
      callTime:{type:Date,default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000)},
  }],
    followUpPriority: { type: String, enum: ['High', 'Medium', 'Low','Closed','Completed'],default:'Medium'},
    callStatusHistory: [{
      type: String,
      enum: ['Answered', 'Not Answered', 'Busy', 'Not Reachable'],
      default: []
    }],
    dispossession_status: {type:Boolean,
      default:true,
    },
  dispossession: { type:String,enum:["follow Up","Completed","Push to agri adviser"], default:null },
  follow_Up_date: {type:Date ,default:null},
  last_active: {
    type: Date,
    default: null,
  },
  lead_category: {
    type: String,
    default: null,
  },
     // For additional fields that may be added dynamically
    miscellaneousFields: { 
      farmer_type:{
        type:String,
        enum:["High Potential Farmer","Preogressive Farmer","Farmer Registered"],
        default:null
      },
      whatsApp_use:{
        type:String,
        enum:["Yes","No","Relative Number"],
        default:null
      },
      sms_alert:{
        type:String,
        enum:["Yes","No"],
        default:null
      },
      other_income_sources:{
        type:String,
        default:null
      },
      mobile_type:{
        type:String,
        enum:["Smart","Basic"],
        default:null
      },
      whatsApp_number_same:{
        type:String,
        enum:["Yes","No"],
        default:null
      },
      adding_whatsApp:{
        type:String,
        enum:["Yes","No"],
        default:null
      }
     },
  },
  {
    timestamps: true,
  }
);

const Leads = mongoose.model("Leads", LeadsSchema);

module.exports = Leads;
