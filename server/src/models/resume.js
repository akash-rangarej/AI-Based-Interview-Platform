// models/Resume.js

const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

    candidate:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    resumeUrl:{
        type:String,
        required:true
    },

    extractedText:String

},{timestamps:true});

module.exports = mongoose.model("Resume",resumeSchema);