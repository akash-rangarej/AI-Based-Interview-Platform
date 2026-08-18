const path = require("path");
const Interview = require('../models/Interview');
const Result = require('../models/Result');
const InterviewPost = require('../models/interviewpost')
const cloudinary = require("../config/cloudinary")
const fs = require("fs")
const AIUsage = require("../models/AIUsage");
const Admin = require("../models/Admin")
const { createMailTransporter } = require("../controllers/authController");
const uploadQueue = require("../../upload-pipeline/queues/upload.queue")
const User = require('../models/User');
const OpenAI = require('openai');
const InterviewViolation = require("../models/interviewViolation");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const startInterview = async (req, res) => {
  try {

    const { jobRole, jobDescription, skills, difficulty, numberOfQuestions, postId } = req.body;
    const candidateId = req.user.id;

    const existingInterview = await Interview.findOne({
      postId,
      candidateId,
      status: "in_progress",
    });

    if (existingInterview) {
      return res.status(200).json({
        success: true,
        resumed: true,
        interviewId: existingInterview._id,
        message: "Interview resumed.",
      });
    }
    const user = await User.findById(candidateId).select("name email skills education experience projects");

    if (!user) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    if (
      !(user.skills?.length) &&
      !(user.education?.length) &&
      !(user.experience?.length) &&
      !(user.projects?.length)) {
      return res.status(400).json({ message: 'profile should be filled before attending the interview' });
    }

  const questions = [
      {
        questionText: "Tell me about yourself.",
        category: "introduction",
        difficulty: "easy",
        orderIndex: 1,
      },
      {
        questionText: "Explain the difference between var, let, and const in JavaScript.",
        category: "technical",
        difficulty: "medium",
        orderIndex: 2,
      },
      {
        questionText: "What is React's Virtual DOM and why is it used?",
        category: "technical",
        difficulty: "medium",
        orderIndex: 3,
      },
      {
        questionText: "How would you optimize the performance of a MERN stack application?",
        category: "technical",
        difficulty: "hard",
        orderIndex: 4,
      },
      {
        questionText: "Describe a challenging situation you faced while working on a project and how you handled it.",
        category: "behavioral",
        difficulty: "medium",
        orderIndex: 5,
      },
      {
        questionText: "Do you have any questions for us?",
        category: "wrap-up",
        difficulty: "easy",
        orderIndex: 6,
      },
    ];
    const post = await InterviewPost.findById(postId)
    const recruiterId = post.postedBy
    const interview = await Interview.create({
      recruiterId,
      postId,
      candidateId,
      jobRole,
      jobDescription,
      skills,
      difficulty,
      status: 'in_progress',
      startedAt: new Date(),
      questions,
    });

    res.status(201).json({
      success: true,
      interviewId: interview._id,
      message: 'Interview started',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNextQuestion = async (req, res) => {
  try {
    let interview = null;
    if (!interview) {

      interview = await Interview.findById(req.params.id);
    }
    if (!interview) return res.status(404).json({ message: 'Interview not found' });


    const nextQuestion = interview.questions.find((q) => !q.answeredAt);

    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        question: null,
        message: 'All questions answered',
      });
    }
    console.log("next question:", nextQuestion.questionText)
    res.status(200).json({
      success: true,
      question: {
        _id: nextQuestion._id,
        questionText: nextQuestion.questionText,
        category: nextQuestion.category,
        difficulty: nextQuestion.difficulty,
        orderIndex: nextQuestion.orderIndex,
      },
      totalQuestions: interview.questions.length,
    });
  }
  catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveAnswer = async (req, res) => {
  try {
    const { questionId, transcript } = req.body;

    const videoFile = req.files.video?.[0];

    const interview = await Interview.findById(req.params.id);

    let violation

    if (!interview)
      return res.status(404).json({
        message: "Interview not found",
      });

    const question = interview.questions.id(questionId);

    if (!question)
      return res.status(404).json({
        message: "Question not found",
      });

    question.answerText = transcript;

    question.localRecordingPath = videoFile.path;

    question.uploadStatus = "pending";

    question.uploadAttempts = 0;

    question.answeredAt = new Date();

    await interview.save();

    // adding the video uploading work to queue for parallel processing
    await uploadQueue.add(
      "upload-video",
      {
        interviewId: interview._id,
        questionId: question._id,
      },
      {
        jobId: `${interview._id}-${question._id}`,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return res.json({
      success: true,
      message: "Answer saved locally",
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// "tabSwitch" and "fullscreen" are tracked as SEPARATE counters —
// termination fires when EITHER type individually reaches 2, not when the
// two types sum to 2 (one tab switch + one fullscreen exit should NOT be
// treated as two strikes of the same offense). The frontend still
// debounces simultaneous events from a single physical action (e.g. one
// alt-tab firing both a blur and a fullscreenchange) so that doesn't
// double-increment either counter for what the user experiences as one
// action — but two genuinely distinct violations of the same type is what
// should end the interview.
const interview_violation = async (req, res) => {
  try {
    const { interviewId, type } = req.body;

    console.log("VIOLATION RECEIVED:", { interviewId, type });

    if (!["fullscreen", "tabSwitch"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation type",
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // The interview was already terminated/submitted by another (possibly
    // racing) violation request. Tell the client so it can stop cleanly
    // instead of surfacing this as a 404/error — this is what was showing
    // up as the stray "Interview not found" response in the network tab.
    if (interview.status !== "in_progress") {
      return res.status(200).json({
        success: true,
        terminate: true,
        alreadyEnded: true,
        type,
        message: "Interview already ended",
      });
    }

    const field = type; // "fullscreen" or "tabSwitch" — matches schema field names directly

    const violation = await InterviewViolation.findOneAndUpdate(
      { interviewId },
      { $inc: { [field]: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const count = violation[field];

    console.log(`${type} violation count for ${interviewId}:`, count);

    // SECOND violation of THIS SAME type
    if (count >= 2) {
      return res.status(200).json({
        success: true,
        terminate: true,
        count,
        type,
        message: `Second ${type} violation`,
      });
    }

    // FIRST violation of this type
    return res.status(200).json({
      success: true,
      terminate: false,
      count,
      type,
      message: `First ${type} violation`,
    });

  } catch (err) {

    console.error("Violation error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const submitInterview = async (req, res) => {

  const { terminate } = req.body;

  try {

    const interview =
      await Interview.findById(req.params.id);

    if (!interview) {

      return res.status(404).json({
        message: "Interview not found",
      });

    }

    const existing =
      await Result.findOne({
        interviewId: interview._id,
      });

    if (existing) {

      return res.status(200).json({
        success: true,
        resultId: existing._id,
        message: "Result already exists",
      });

    }

    if (terminate) {

      // Atomically claim termination. If two violation channels raced
      // each other to this endpoint, only the first one finds the
      // document still "in_progress" and flips it — the loser gets
      // `claimed === null` and returns the already-created result
      // instead of re-running (and re-emailing, re-deleting-the-post,
      // etc.) the whole termination flow a second time.
      const claimed = await Interview.findOneAndUpdate(
        { _id: interview._id, status: "in_progress" },
        { $set: { status: "terminated", submittedAt: new Date() } }
      );

      if (!claimed) {
        const existingResult = await Result.findOne({ interviewId: interview._id });
        return res.status(200).json({
          success: true,
          result: existingResult || null,
          message: "Interview already terminated",
        });
      }

      const recruiter = await Admin.findById(interview.recruiterId).select("name email")
      const candidate = await User.findById(interview.candidateId).select("name email")

      const summary = {
        strengths: [
          "Good communication skills",
          "Demonstrates basic technical knowledge"
        ],
        weaknesses: [
          "Needs deeper understanding of advanced concepts",
          "Could provide more structured answers"
        ],
        recommendation: "cheated"
      };
      const overallScore = 0;

      const result = await Result.create({
        interviewId: interview._id,
        recruiter: recruiter.name,
        recruiterId: interview.recruiterId,
        candidateId: interview.candidateId,
        overallScore: overallScore,
        summary: {
          totalQuestions: interview.questions.length,
          averageScore: overallScore,
          ...summary,
        },
        questions: interview.questions,
        evaluatedAt: new Date(),
      });

      const transporter = createMailTransporter();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recruiter.email,
        subject: "interview rules violation notification",
        text: `the candidate with email : ${candidate.email}
         has violated the interview rules by exiting full screeen multiple times`
      });

      await InterviewPost.findByIdAndDelete(interview.postId)

      await InterviewViolation.findOneAndDelete({
        interviewId: interview._id,
      });

      return res.status(200).json({
        result: result
      });

    }


    return res.status(200).json({

      success: true,

      message:
        "Interview submitted successfully. Evaluation started.",

    });

  }

  catch (err) {

    return res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};


const getResult = async (req, res) => {
  try {
    const result = await Result.findOne({ interviewId: req.params.interviewId })
      .populate('candidateId', 'name email');

    if (!result) return res.status(404).json({ message: 'Result not found' });

    const interview = await Interview.findById(req.params.interviewId);

    res.status(200).json({
      success: true,
      data: {
        result,
        questions: interview.questions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const autoSubmitInterview = async (interviewId, reason = "connection-timeout") => {

  try {

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      console.error(`autoSubmitInterview: interview not found [${interviewId}]`);
      return;
    }

    const existingResult = await Result.findOne({ interviewId: interview._id });

    if (existingResult) {
      return;
    }
    const claimed = await Interview.findOneAndUpdate(
      { _id: interview._id, status: "in_progress" },
      { $set: { status: "auto_submitted", submittedAt: new Date(), endReason: reason } }
    );

    if (!claimed) {
      return;
    }

    const result = await Result.create({
      interviewId: interview._id,
      recruiterId: interview.recruiterId,
      candidateId: interview.candidateId,
      overallScore: 0,
      summary: {
        totalQuestions: interview.questions.length,
        averageScore: 0,
        recommendation: "incomplete",
        note: "Interview ended automatically due to a lost connection that was not restored in time.",
      },
      questions: interview.questions,
      evaluatedAt: new Date(),
    });

    await InterviewViolation.findOneAndDelete({ interviewId: interview._id });

    console.log(`Interview auto-submitted [${interviewId}] due to: ${reason}`);

    return result;

  } catch (err) {
    console.error(`autoSubmitInterview failed [${interviewId}]:`, err);
  }

};

module.exports = {
  startInterview,
  getNextQuestion,
  saveAnswer,
  interview_violation,
  submitInterview,
  getResult,
  autoSubmitInterview, 
};
