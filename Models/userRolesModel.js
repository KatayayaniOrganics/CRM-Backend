const mongoose = require('mongoose');

const userRolesSchema = new mongoose.Schema({
    role_name: { type: String, required: true },
    level: { type: Number, required: true }
});

const UserRoles = mongoose.model('UserRoles', userRolesSchema);
module.exports =  UserRoles;
