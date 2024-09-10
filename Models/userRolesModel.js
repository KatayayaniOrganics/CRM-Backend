const mongoose = require('mongoose');

const userRolesSchema = new mongoose.Schema({
    UserRoleId:{
        type: String,
        unique:true,
        default:"USR-1000",  
      },
    role_name: { type: String, required: true },
    level: { type: Number, required: true}
});

const UserRoles = mongoose.model('UserRoles', userRolesSchema);
module.exports =  UserRoles;
