const AIUsage = require("../models/AIUsage");
const User = require("../models/User");
const Admin = require("../models/Admin")
const Result = require("../models/Result")
const Interview = require("../models/Interview")
const InterviewPost = require("../models/interviewpost")
const bcrypt = require("bcryptjs")
const cloudinary = require("../config/cloudinary")
const { createMailTransporter } = require("./authController")

const transporter = createMailTransporter();

const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: "candidate" })
      .select("_id name email");

    res.status(200).json({ candidates });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch candidates. Please try again later." });
  }
};

const getRecruiters = async (req, res) => {
  try {
    const recruiters = await Admin.find({})
      .select("name email");

    res.status(200).json({ recruiters });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch recruiters. Please try again later." });
  }
};

const addRecruiter = async (req, res) => {
  try {

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required."
      })
    }

    const emailExist = await Admin.findOne({ email })

    if (emailExist) {
      return res.status(409).json({
        message: "A recruiter with this email is already registered."
      })
    }
    const hashedEnvPassword = await bcrypt.hash(process.env.RECRUITER_PASSWORD, 10)
    const recruiter = await Admin.create({
      name,
      email,
      password: hashedEnvPassword
    })

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Portal Invitation",
        text: `Dear ${name}, you have been added as a recruiter on the interview platform by an admin.`
      });
    } catch (mailErr) {
      // Recruiter was created successfully even if the notification email failed

    }

    return res.status(201).json({
      recruiter: recruiter,
      message: "Recruiter added successfully."
    })


  }
  catch (err) {
    res.status(500).json({
      message: "Unable to add recruiter. Please try again later."
    })

  }
}

const deleteRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const info = await Admin.findById(id).select("name email")

    if (!info) {
      return res.status(404).json({ message: "Recruiter not found." });
    }

    const recruiter = await Admin.findOneAndDelete({
      _id: id,
    });

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found." });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: info.email,
        subject: "Removed From Platform",
        text: `Dear ${info.name}, you have been removed from the interview platform by an admin.`
      });
    } catch (mailErr) {
      
      // Deletion already succeeded even if the notification email failed
    }

    res.status(200).json({ message: "Recruiter deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete recruiter. Please try again later." });
  }
};




const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const info = await User.findById(id).select("name email")

    if (!info) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    const candidate = await User.findOneAndDelete({
      _id: id,
      role: "candidate"
    });


    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: info.email,
        subject: "Removed From Platform",
        text: `Dear ${info.name}, you have been removed from the interview platform by an admin.`
      });
    } catch (mailErr) {
      // Deletion already succeeded even if the notification email failed
    }

    res.status(200).json({ message: "Candidate deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete candidate. Please try again later." });
  }
};



function getPublicIdVideo(videoUrl) {
  const parts = videoUrl.split("/upload/")[1];

  // Remove version number
  const withoutVersion = parts.replace(/^v\d+\//, "");

  // Remove extension
  return withoutVersion.replace(/\.[^/.]+$/, "");
}



const Deleteresults = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to perform this action.",
      });
    }

    const result = await Result.findById(req.params.resultID)
      .select("interviewId questions")
      .lean();

    if (!result) {
      return res.status(404).json({
        message: "Result not found.",
      });
    }

    const interview = await Interview.findByIdAndDelete(result.interviewId)
    if (!interview) {
      return res.status(404).json({
        message: "Associated interview not found.",
      });
    }

    // Delete all Cloudinary videos in parallel
    await Promise.all(
      result.questions
        .filter((q) => q.recordingUrl)
        .map(async (q) => {
          try {
            const publicId = getPublicIdVideo(q.recordingUrl);

            await cloudinary.uploader.destroy(publicId, {
              resource_type: "video",
            });
          } catch (err) {
          }
        })
    );

    await Result.findByIdAndDelete(req.params.resultID);

    return res.status(200).json({
      message: "Result deleted successfully.",
    });
  } catch (err) {

    return res.status(500).json({
      message: "Unable to delete result. Please try again later.",
    });
  }
};


const getAIAnalytics = async (req, res) => {
  try {
    let analytics = await AIUsage.findOne({});

    if (!analytics) {
      analytics = await AIUsage.create({});
    }

    const totalInterviews = await InterviewPost.countDocuments();
    const COST_PER_1M_TOKENS = 6.25;

    const estimatedCost = (analytics.totalTokens / 1_000_000) * COST_PER_1M_TOKENS;

    res.status(200).json({
      totalRequests: analytics.totalRequests,
      questionTokens: analytics.questionTokens,
      resumeTokens: analytics.resumeTokens,
      evaluationTokens: analytics.evaluationTokens,
      totalInterviews: totalInterviews,
      summaryTokens: analytics.summaryTokens,
      totalTokens: analytics.totalTokens,
      estimatedCost: estimatedCost.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch AI analytics. Please try again later.",
    });
  }
};



module.exports = {
  getAIAnalytics,
  getCandidates,
  getRecruiters,
  addRecruiter,
  deleteCandidate,
  deleteRecruiter,
  Deleteresults
};