const path = require("path");
const Interview = require('../models/Interview');
const Result = require('../models/result');
const InterviewPost = require('../models/interviewpost')
const AIUsage = require("../models/AIUsage");
const Admin = require("../models/Admin")
const { createMailTransporter } = require("../controllers/authController");
const uploadQueue = require("../../upload-pipeline/queues/upload.queue")
const User = require('../models/User');
const InterviewViolation = require("../models/interviewViolation");
const OpenAI = require('openai');
const { brevo } = require('./authController');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BrevoEmail = brevo


const startInterview = async (req, res) => {
  try {
    const { postId } = req.body;
    const candidateId = req.user.id;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId is required.",
      });
    }

    // Get interview configuration from DB
    const post = await InterviewPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Interview post not found.",
      });
    }

    // Make sure this interview is scheduled
    if (post.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "This interview is not currently available.",
      });
    }

    // Get interview details from DB
    const jobRole = post.role;
    const jobDescription = post.jobDescription;
    const skills = post.skills;
    const difficulty = post.difficulty;
    const numberOfQuestions = post.numberOfQuestions;

    console.log("Interview configuration:", {
      postId,
      jobRole,
      difficulty,
      numberOfQuestions,
      skills,
    });

    // Check if candidate already has an interview in progress
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

    //created this helper functions to format education for the prompt
    function formatEducation(education = []) {
      if (!education.length) return "Not provided";

      return education
        .map(
          (edu) => `
        - ${edu.degree}
          Institution: ${edu.institution}
          Duration: ${edu.years}
          GPA: ${edu.gpa}
          Location: ${edu.location}`
        )
        .join("\n");
    }
    //created this helper functions to format experience for the prompt
    function formatExperience(experience = []) {
      if (!experience.length) return "Fresher";

      return experience
        .map(
          (exp) => `
        - ${exp.designation} at ${exp.company}
          Duration: ${exp.dates}
          Responsibilities:
          ${exp.description?.map((d) => `• ${d}`).join("\n  ") || "Not provided"}`
        )
        .join("\n");
    }
    //created this helper functions to format projects for the prompt 
    function formatProjects(projects = []) {
      if (!projects.length) return "No projects provided";

      return projects
        .map(
          (project) => `
        - ${project.title}
          Technologies: ${project.technologies?.join(", ") || "Not specified"}
          Description: ${project.description}`
        )
        .join("\n");
    }

    // generate all questions at once based on the job requirements and candidate profile
    const prompt = `
      You are an experienced technical interviewer conducting a ${difficulty} level interview for the role of ${jobRole}.

      ========================
      JOB REQUIREMENTS
      ========================

      Role:
      ${jobRole}

      Job Description:
      ${jobDescription}

      Required Skills:
      ${skills.join(", ")}

      ========================
      CANDIDATE PROFILE
      ========================

      Name:
      ${user.name}

      Current Role:
      ${user.role || "Not provided"}

      Skills:
      ${user.skills?.length ? user.skills.join(", ") : "Not provided"}

      Education:
      ${formatEducation(user.education)}

      Experience:
      ${formatExperience(user.experience)}

      Projects:
      ${formatProjects(user.projects)}

      ========================
      YOUR TASK
      ========================

      Generate exactly ${numberOfQuestions} interview questions that evaluate how well the candidate fits this role by considering BOTH:

      1. The job requirements.
      2. The candidate's profile.

      Interview Rules:

      1. Question 1 MUST always be:
        "Tell me about yourself."

      2. Questions 2-${numberOfQuestions - 1} MUST be technical and behavioural.
        - Base them on BOTH the job requirements and the candidate's profile.
        - Prioritize skills that appear in both the required skills and the candidate's skills.
        - If the candidate has relevant projects, ask project-specific technical questions about:
          • architecture
          • implementation
          • design decisions
          • debugging
          • optimization
          • scalability
          • security
          • testing
          • deployment
          • trade-offs
        - If the candidate has relevant work experience, ask questions related to technologies, responsibilities, and challenges from that experience.
        - If an important required skill is NOT present in the candidate's profile, ask a conceptual question to evaluate their understanding.
        - Match the complexity of the questions to the selected difficulty level (${difficulty}).
        - If the candidate has work experience, base the question on realistic workplace situations.
        - If the candidate is a fresher, ask a project-based or hypothetical scenario relevant to the role.

      4. Last Question MUST always be:
        "Do you have any questions for us?"

      Additional Rules:

      - Personalize questions whenever possible.
      - Do NOT ask the candidate to simply list their skills, explain their resume, or repeat information already available in the candidate profile.
      - Avoid generic questions when the candidate's projects or experience provide enough context for deeper technical questions.
      - Do NOT repeat any question.
      - Keep questions clear, concise, and interview-appropriate.
      - Ensure every question is unique.
      - Return EXACTLY ${numberOfQuestions} questions.

         Return ONLY a valid JSON array of ${numberOfQuestions} objects, nothing else. No markdown, no explanation.
         Format:
         [
           { "questionText": "..." },
           { "questionText": "..." },
           { "questionText": "..."},
           { "questionText": "..." },
           { "questionText": "..."},
           { "questionText": "..."},
                        .
                        .
                        .
                        .
             { "questionText": "..."}
           ]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    questionText: {
                      type: "string",
                    },
                  },
                  required: ["questionText"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    await AIUsage.findOneAndUpdate({},
      {
        $inc: {
          totalRequests: 1,
          questionTokens: response.usage.total_tokens,
          totalTokens: response.usage.total_tokens,
        },
      }
    );

    const parsed = JSON.parse(response.choices[0].message.content);

    // build questions array with orderIndex
    const questions = parsed.questions.map((q, i) => ({
      questionText: q.questionText,
      orderIndex: i + 1,
    }));

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
    res.status(200).json({
      success: true,
      question: {
        _id: nextQuestion._id,
        questionText: nextQuestion.questionText,
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
          "cheated",
        ],
        weaknesses: [
          "cheated"
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

      // const transporter = createMailTransporter();

      // await transporter.sendMail({
      //   from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      //   to: recruiter.email,
      //   subject: "interview rules violation notification",
      //   text: `the candidate with email : ${candidate.email}
      //    has violated the interview rules by exiting full screeen multiple times`
      // });

      try {
        await BrevoEmail.transactionalEmails.sendTransacEmail({
          sender: {
            email: process.env.EMAIL_FROM,
          },

          to: [
            {
              email: recruiter.email,
            },
          ],

          subject: "interview rules violation notification",

          textContent: `the candidate with email : ${candidate.email}
        has violated the interview rules by exiting full screeen multiple times`,

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
