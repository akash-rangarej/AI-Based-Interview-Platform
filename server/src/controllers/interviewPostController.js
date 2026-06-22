const interviewpost = require("../models/interviewpost");
const InterviewPost = require("../models/interviewpost");
const User = require("../models/User");

// ─────────────────────────────────────────────
// POST /api/interviews/post
// Recruiter submits the form
// ─────────────────────────────────────────────
const createInterviewPost = async (req, res) => {
  try {
    const {
      roundName,
      role,
      jd,
      skills,
      candidateType,
      minExperience,
      maxExperience,
      difficulty,
      questions,
      followUps,
      adaptive,
      Email,
    } = req.body;

    if (!roundName || !role) {
      return res.status(400).json({ message: "Round name and role are required." });
    }

    const skillsArray = skills
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const user = await User.find({role:"candidate",email:Email})

    if (!user){
      return res.status(403).json({message:"invalid user or user does not exist."});
    }

    const post = await InterviewPost.create({
      roundName,
      role,
      jobDescription: jd || "",
      skills: skillsArray,
      candidateType,
      minExperience: candidateType === "experienced" ? Number(minExperience) : null,
      maxExperience: candidateType === "experienced" ? Number(maxExperience) : null,
      difficulty,
      numberOfQuestions: Number(questions) || 10,
      followUps,
      adaptive,
      candidateEmail: Email,
      postedBy: req.user.id,
    });

    return res.status(201).json({
      message: "Interview posted successfully.",
      postId: post._id,
      expiresAt: post.expiresAt,
    });
  } catch (err) {
    console.error("createInterviewPost error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────
// GET /api/interviews/dashboard
// Candidate sees all active posts meant for them
// ─────────────────────────────────────────────
const Can_getDashboardPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email role");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let query = { status: "active", expiresAt: { $gt: new Date() } };
    let fields = "roundName role skills candidateType minExperience maxExperience expiresAt status";

      query.candidateEmail = user.email;

    const posts = await InterviewPost.find(query)
      .select(fields)
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });

  } catch (err) {
    console.error(" candidate getDashboardPosts error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


const Rec_getDashboardPosts = async (req,res) =>{
  try {
    const user = await User.findById(req.user.id).select("email role");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  let query = { postedBy: req.user.id, status: "active", expiresAt: { $gt: new Date() } };
    let fields = "roundName role skills candidateType minExperience maxExperience expiresAt status difficulty numberOfQuestions candidateEmail"

const posts = await InterviewPost.find(query)
      .select(fields)
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });
}
catch(err){
 console.error(" recruiter getDashboardPosts error:", err);
    res.status(500).json({ message: "Server error." });
}
}
// ─────────────────────────────────────────────
// GET /api/interviews/:postId
// Candidate fetches full post before starting interview
// ─────────────────────────────────────────────
const getInterviewPostById = async (req, res) => {
  try {
    const post = await InterviewPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Interview not found or has expired." });
    }

    if (post.status !== "active" || post.expiresAt < new Date()) {
      return res.status(410).json({ message: "This interview is no longer available." });
    }

    if (post.candidateEmail && post.candidateEmail !== req.user.email) {
      return res.status(403).json({ message: "This interview is not meant for you." });
    }

    res.status(200).json({ post });
  } catch (err) {
    console.error("getInterviewPostById error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


// Call this when candidate completes the interview
const completeInterviewPost = async (req, res) => {
  try {
    const post = await InterviewPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.status = "completed";
    post.expiresAt = undefined; 
    await post.save();

    res.status(200).json({ message: "Interview marked as completed." });
  } catch (err) {
    console.error("completeInterviewPost error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


// delete post by the recruiter
const deleteInterviewPost = async (req, res) => {
  try {
    await InterviewPost.findOneAndDelete({ _id: req.params.postId, postedBy: req.user.id });
    res.status(200).json({ message: "Post deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};


module.exports = {
  createInterviewPost,
  Can_getDashboardPosts,
  Rec_getDashboardPosts,
  getInterviewPostById,
  completeInterviewPost,
  deleteInterviewPost
};