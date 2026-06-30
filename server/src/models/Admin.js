const mongoose = require("mongoose")

const AdminSchema = new mongoose.Schema({

    name: {
        type:String
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    role:{
        type:String,
        default:"recruiter"
    }
})

module.exports = mongoose.model("Admin", AdminSchema);