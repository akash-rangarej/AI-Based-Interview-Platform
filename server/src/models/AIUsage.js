const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema({
  totalRequests: {
    type: Number,
    default: 0,
  },

  totalInterviews: {
    type: Number,
    default: 0,
  },

  questionTokens: {
    type: Number,
    default: 0,
  },

  evaluationTokens: {
    type: Number,
    default: 0,
  },

  summaryTokens: {
    type: Number,
    default: 0,
  },

  totalTokens: {
    type: Number,
    default: 0,
  },

  resumeTokens: {
  type: Number,
  default: 0,
},

});

module.exports = mongoose.model("AIUsage", aiUsageSchema);