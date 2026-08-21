const Result = require("../models/result");
const User = require("../models/User")
const Interview = require("../models/Interview");
const { deleteInterviewPost } = require("./interviewPostController");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs")
const Interviewpost = require("../models/interviewpost")
const createMailTransporter = require("./authController")
const cloudinary  = require("../config/cloudinary")


// controllers/userController.js
const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: "candidate" })
      .select("name email skills experience education projects certificates profileCompleted")
      .sort({ createdAt: -1 });
    res.status(200).json({ candidates });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};


const getPerformance = async (req, res) => {
  try {
    let results = null;
    let filteredResults = null;
    if (req.user.id === "admin"){
      
      results = await Result.find()
  .select("recruiter candidateId interviewId overallScore summary questions")
  .populate("candidateId", "name email")
  .populate({
    path: "interviewId",
    populate: {
      path: "recruiterId",
      select: "name"
    }
  });
        filteredResults = results.filter(
      r => r.interviewId)
    }

    else{
      const recruiterId = req.user.id;
      
      results = await Result.find()
      .populate("candidateId", "name email")
      .populate({
        path:"interviewId",
        match:{
          recruiterId
        } 
      });
      filteredResults = results.filter(
        r => r.interviewId
      );
    }

    res.status(200).json({
      success: true,
      results: filteredResults,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


const setpassword = async (req, res) => {
  const { password } = req.body;
  try {
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await Admin.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      passwordChanged: true
    })

    return res.status(200).json({
      message: "the password set successfully",
      passwordChanged: true
    })
  }
  catch (err) {

    return res.status(500).json({
      message: err.message
    });
  }

}


module.exports = {
  getCandidates,
  getPerformance,
  setpassword,
};
