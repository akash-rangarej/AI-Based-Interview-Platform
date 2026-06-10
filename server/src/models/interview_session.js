const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    questions: [String],

    answers: [String],

    score: Number,

    feedback: String
},
{ timestamps: true });

module.exports = mongoose.model(
    "InterviewSession",
    interviewSessionSchema
);