const Result = require("../models/Result");
const User  = require("../models/User")


// controllers/userController.js
const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: "candidate" })
      .select("name  ph_no email skills experience education profileCompleted")
      .sort({ createdAt: -1 });
    res.status(200).json({ candidates });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};


const getPerformance = async (req, res) => {
  try {

    const recruiterId = req.user.id;

    const results = await Result.find()
      .populate("candidateId", "name email")
      .populate({
        path: "interviewId",
        match: {
          recruiterId
        }
      });

    const filteredResults = results.filter(
      r => r.interviewId
    );

    res.status(200).json({
      success: true,
      results: filteredResults
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


module.exports = {
    getCandidates,
    getPerformance
};