

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    role:{
        type:String,
        enum:["admin","candidate","recruiter"],
        default:"candidate"
    },

    phone:String,

    skills:[String],

    education:[String],

    projects:[String],

    experience:[String],

    profileCompleted:{
        type:Boolean,
        default:false
    }

},{timestamps:true});

module.exports = mongoose.model("User",userSchema);