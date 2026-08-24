// const interviewpost = require("../models/interviewpost");
const InterviewPost = require("../models/interviewpost");
const User = require("../models/User");
const Admin = require("../models/Admin")
const nodemailer = require("nodemailer");
const brevo = require('./authController');

const BrevoEmail = brevo
// ─────────────────────────────────────────────
// POST /api/interviews/post
// Recruiter submits the form
// ─────────────────────────────────────────────
// const createMailTransporter = () => {
//     return nodemailer.createTransport({
//         service: process.env.EMAIL_SERVICE,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//         }
//     });
// };

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
      interviewDate,
      startTime,
      endTime,
      duration
    } = req.body;

    if (!roundName || !role) {
      return res.status(400).json({ message: "Round name and role are required." });
    }
    if (!interviewDate || !startTime || !endTime || !duration) {
      return res.status(400).json({ message: "interviewDate, startTime, endTime and duration are required." });
    }
    const interview = new Date(interviewDate);
    const start = new Date(`${interviewDate}T${startTime}`);
    const end = new Date(`${interviewDate}T${endTime}`);
    const dur = Number(duration);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time window." });
    }
    if (!dur || dur <= 0 || (end - start) < dur * 60000) {
      return res.status(400).json({ message: "Duration doesn't fit inside the window." });
    }

    const skillsArray = skills
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const user = await User.find({ email: Email })

    if (user.length === 0) {
      return res.status(403).json({ message: "invalid user or user does not exist." });
    }

    const exists = await InterviewPost.findOne({ candidateEmail: Email });

    if (exists) {
      return res.status(400).json({ message: "the candidate hasnt finised the pev interview" });
    }


    //  const transporter = createMailTransporter();


    const post = await InterviewPost.create({
      roundName,
      role,
      jobDescription: jd || "",
      skills: skillsArray,
      candidateType,
      minExperience: candidateType === "experienced" ? Number(minExperience) : null,
      maxExperience: candidateType === "experienced" ? Number(maxExperience) : null,
      difficulty,
      numberOfQuestions: Number(questions) || 15,
      followUps,
      adaptive,
      candidateEmail: Email,
      postedBy: req.user.id,
      interviewDate: interview,
      startTime: start,
      endTime: end,
      duration: dur,
    });

    //   await transporter.sendMail({
    //    from: process.env.EMAIL_USER,
    //    to: Email,
    //    subject: "New Interview Post",
    //    text: `You have a new interview post for the role of ${role}. Please check your dashboard for details.`,
    //  });

    try {
      await BrevoEmail.transactionalEmails.sendTransacEmail({
        sender: {
          email: process.env.EMAIL_FROM,
        },

        to: [
          {
            email: Email,
          },
        ],

        subject: "New Interview Post",

        textContent: `You have a new interview post for the role of ${role}. Please check your dashboard for details.`,

      });

      console.log(
        "OTP email sent successfully:",
        result?.messageId
      );

    } catch (error) {
      console.error(
        "Brevo email error:",
        error
      );

      throw new Error(
        "Failed to send OTP email."
      );
    }

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

    let query = { status: { $in: ["active", "scheduled"] }, candidateEmail: user.email };
    let fields = "roundName role skills jobDescription candidateType minExperience maxExperience expiresAt status interviewDate startTime endTime duration";

    // query.candidateEmail = user.email;

    const posts = await InterviewPost.find(query)
      .select(fields)
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });

  } catch (err) {
    console.error(" candidate getDashboardPosts error:", err);
    res.status(500).json({ message: "Server error." });
  }
};


const Rec_getDashboardPosts = async (req, res) => {
  try {
    const user = await Admin.findById(req.user.id).select("email role");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let query = { postedBy: req.user.id, status: { $in: ["active", "scheduled"] } };
    let fields = "roundName role skills candidateType minExperience maxExperience expiresAt createdAt status difficulty numberOfQuestions candidateEmail"

    const posts = await InterviewPost.find(query)
      .select(fields)
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  }
  catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

// GET /api/interviews/:postId
//this function is to update the start and endtime in our interviewpost schema which we r getting from ScheduleTime.jsx
const selectInterviewSlot = async (req, res) => {
  try {
    const { postId } = req.params;
    const { slotStart } = req.body;

    if (!slotStart) {
      return res.status(400).json({ message: "slotStart is required." });
    }

    const post = await InterviewPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Interview not found or has expired." });
    }

    if (post.status !== "active") {
      return res.status(410).json({ message: "This interview is no longer available." });
    }

    const start = new Date(slotStart);

    if (isNaN(start)) {
      return res.status(400).json({ message: "Invalid slotStart." });
    }
    const end = new Date(start.getTime() + post.duration * 60000);

    if (start < post.startTime || end > post.endTime) {
      return res.status(400).json({ message: "Selected slot is outside the interview window." });
    }

    const offsetMs = start.getTime() - post.startTime.getTime();
    if (offsetMs % (post.duration * 60000) !== 0) {
      return res.status(400).json({ message: "Slot does not align to the allowed time grid." });
    }

    post.startTime = start;
    post.endTime = end;
    post.status = "scheduled";
    await post.save();

    return res.status(200).json({
      message: "Interview slot confirmed.",
      startTime: post.startTime,
      endTime: post.endTime,
    });
  } catch (err) {
    console.error("selectInterviewSlot error:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
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
  deleteInterviewPost,
  selectInterviewSlot
};