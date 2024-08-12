const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    leadOwner: { type: String, required: true },
    firstName: { type: String },
    appInstalls: { type: Boolean, default: false },
    kylasOwner: { type: String },
    callAttempt: { type: String },
    salesPersonId: { type: String },
    leadCustomerType: { type: String },
    title: { type: String },
    phone: { type: String },
    mobile: { type: String },
    leadSource: { type: String },
    detailsUpdated: { type: Boolean, default: false },
    industry: { type: String },
    annualRevenue: { type: Number },
    company: { type: String },
    lastName: { type: String, required: true },
    email: { type: String },
    fax: { type: String },
    website: { type: String },
    leadStatus: { type: String },
    leadSegment: { type: String },
    numberOfEmployees: { type: Number },
    rating: { type: String },
    skypeId: { type: String },
    secondaryEmail: { type: String },
    twitter: { type: String },
    department: { type: String },
    leadType: { type: String },
    pipeline: { type: String },
    companyCity: { type: String },
    companyZipcode: { type: String },
    companyEmployees: { type: Number },
    businessType: { type: String },
    actualClosureDate: { type: Date },
    convertedAt: { type: Date },
    convertedBy: { type: String },
    importedBy: { type: String },
    updatedAt: { type: Date },
    identification: { type: String },
    emailOptOut: { type: Boolean, default: false },
    timezone: { type: String },
    facebook: { type: String },
    address: { type: String },
    companyAddress: { type: String },
    companyState: { type: String },
    companyCountry: { type: String },
    companyPhones: { type: String },
    budget: { type: Number },

    // For additional fields that may be added dynamically
    additionalFields: { type: mongoose.Schema.Types.Mixed, default: {} }

}, {
    timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
