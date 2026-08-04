const path = require("path");
const Interview = require('../models/Interview');
const Result = require('../models/Result');
const InterviewPost = require('../models/interviewpost')
const cloudinary = require("../config/cloudinary")
const fs = require("fs")
const AIUsage = require("../models/AIUsage");
const Admin = require("../models/Admin")
const {createMailTransporter} = require("../controllers/authController");
const User = require('../models/User');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let postidforviolation = ""

const startInterview = async (req, res) => {
  try {

    const { jobRole, jobDescription, skills, difficulty, numberOfQuestions, postId } = req.body;
    const candidateId = req.user.id;
    postidforviolation = postId

    const user = await User.findById(candidateId).select("name email skills education experience projects");

    if (!user) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    if ( 
      !(user.skills?.length) &&
      !(user.education?.length) &&
      !(user.experience?.length) &&
      !(user.projects?.length)){
      return res.status(400).json({ message: 'profile should be filled before attending the interview' });
    }

  if (
  !user.skills?.length ||
  !user.education?.length ||
  !user.experience?.length ||
  !user.projects?.length
) {
  return res.status(400).json({
    message: "Please upload your resume before attending the interview"
  });
}
  //created this helper functions to format education for the prompt
//     function formatEducation(education = []) {
//       if (!education.length) return "Not provided";

//       return education
//         .map(
//           (edu) => `
//     - ${edu.degree}
//       Institution: ${edu.institution}
//       Duration: ${edu.years}
//       GPA: ${edu.gpa}
//       Location: ${edu.location}`
//         )
//         .join("\n");
//     }
// //created this helper functions to format experience for the prompt
//     function formatExperience(experience = []) {
//       if (!experience.length) return "Fresher";

//       return experience
//         .map(
//           (exp) => `
//     - ${exp.designation} at ${exp.company}
//       Duration: ${exp.dates}
//       Responsibilities:
//       ${exp.description?.map((d) => `• ${d}`).join("\n  ") || "Not provided"}`
//         )
//         .join("\n");
//     }
// //created this helper functions to format projects for the prompt 
//     function formatProjects(projects = []) {
//       if (!projects.length) return "No projects provided";

//       return projects
//         .map(
//           (project) => `
//     - ${project.title}
//       Technologies: ${project.technologies?.join(", ") || "Not specified"}
//       Description: ${project.description}`
//         )
//         .join("\n");
//     }

//     // generate all questions at once based on the job requirements and candidate profile
//     const prompt = `
//   You are an experienced technical interviewer conducting a ${difficulty} level interview for the role of ${jobRole}.

//   ========================
//   JOB REQUIREMENTS
//   ========================

//   Role:
//   ${jobRole}

//   Job Description:
//   ${jobDescription}

//   Required Skills:
//   ${skills.join(", ")}

//   ========================
//   CANDIDATE PROFILE
//   ========================

//   Name:
//   ${user.name}

//   Current Role:
//   ${user.role || "Not provided"}

//   Skills:
//   ${user.skills?.length ? user.skills.join(", ") : "Not provided"}

//   Education:
//   ${formatEducation(user.education)}

//   Experience:
//   ${formatExperience(user.experience)}

//   Projects:
//   ${formatProjects(user.projects)}

//   ========================
//   YOUR TASK
//   ========================

//   Generate exactly ${numberOfQuestions} interview questions that evaluate how well the candidate fits this role by considering BOTH:

//   1. The job requirements.
//   2. The candidate's profile.

//   Interview Rules:

//   1. Question 1 MUST always be:
//     "Tell me about yourself."

//   2. Questions 2-4 MUST be technical.
//     - Base them on BOTH the job requirements and the candidate's profile.
//     - Prioritize skills that appear in both the required skills and the candidate's skills.
//     - If the candidate has relevant projects, ask project-specific technical questions about:
//       • architecture
//       • implementation
//       • design decisions
//       • debugging
//       • optimization
//       • scalability
//       • security
//       • testing
//       • deployment
//       • trade-offs
//     - If the candidate has relevant work experience, ask questions related to technologies, responsibilities, and challenges from that experience.
//     - If an important required skill is NOT present in the candidate's profile, ask a conceptual question to evaluate their understanding.
//     - Match the complexity of the questions to the selected difficulty level (${difficulty}).

//   3. Question 5 MUST be behavioral or situational.
//     - If the candidate has work experience, base the question on realistic workplace situations.
//     - If the candidate is a fresher, ask a project-based or hypothetical scenario relevant to the role.

//   4. Question 6 MUST always be:
//     "Do you have any questions for us?"

//   Additional Rules:

//   - Personalize questions whenever possible.
//   - Do NOT ask the candidate to simply list their skills, explain their resume, or repeat information already available in the candidate profile.
//   - Avoid generic questions when the candidate's projects or experience provide enough context for deeper technical questions.
//   - Do NOT repeat any question.
//   - Keep questions clear, concise, and interview-appropriate.
//   - Ensure every question is unique.
//   - Return EXACTLY ${numberOfQuestions} questions.
    
//     // Return ONLY a valid JSON array of 6 objects, nothing else. No markdown, no explanation.
//     // Format:
//     // [
//     //   { "questionText": "...", "category": "introduction", "difficulty": "easy" },
//     //   { "questionText": "...", "category": "technical", "difficulty": "medium" },
//     //   { "questionText": "...", "category": "technical", "difficulty": "medium" },
//     //   { "questionText": "...", "category": "technical", "difficulty": "hard" },
//     //   { "questionText": "...", "category": "behavioral", "difficulty": "medium" },
//     //   { "questionText": "...", "category": "wrap-up", "difficulty": "easy" }
//     //   ]`;

    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4o',
    //   messages: [{ role: 'user', content: prompt }],
    // });

    // await AIUsage.findOneAndUpdate({},
    //   {
    //     $inc: {
    //       totalRequests: 1,
    //       questionTokens: response.usage.total_tokens,
    //       totalTokens: response.usage.total_tokens,
    //     },
    //   }
    // );

    // let raw = response.choices[0].message.content.trim();
    // raw = raw
    //   .replace(/```json\s*/gi, "")
    //   .replace(/```\s*/g, "")
    //   .trim();
    // const parsed = JSON.parse(raw);

    // // build questions array with orderIndex
    // const questions = parsed.map((q, i) => ({
    //   questionText: q.questionText,
    //   category: q.category,
    //   difficulty: q.difficulty,
    //   orderIndex: i + 1,
    // }));

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
      status:'in_progress',
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

    if (!interview)
      return res.status(404).json({
        message: "Interview not found",
      });

    const question = interview.questions.id(questionId);

    if (!question)
      return res.status(404).json({
        message: "Question not found",
      });

    question.answerText = transcript || "";
    question.answeredAt = new Date();

    // Store local file path
    question.localRecordingPath = videoFile.path;

    // Cloudinary upload will happen later
    question.recordingUrl = "";

    await interview.save();

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




const interview_violation = async (req, res) => {
  const { isviolated } = req.body

  try {
    // const post = await InterviewPost.findById(postidforviolation).select("candidateEmail  postedBy")
    // const candidate_email = post.candidateEmail
    // const recruiter = await Admin.findById(post.postedBy).select("email name")
    // await InterviewPost.findByIdAndDelete(postidforviolation)
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    
    const existingResult = await Result.findOne({
      interviewId: interview._id,
    });
    
    if (existingResult) {
      return res.status(200).json({
        success: true,
        resultId: existingResult._id,
        message: "Result already exists",
      });
    }
    
    interview.status = 'completed';
    interview.submittedAt = new Date();
    await interview.save();
    
    const recruiter = await Admin.findById(interview.recruiterId).select("name email")
    const candidate = await Admin.findById(interview.candidateId).select("name email")

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
      text: `the candidate ${candidate.name} with email : ${candidate.email}
       has violated the interview rules by switching tabs multiple times, 
       and the interview post and interview has been terminated.`
    });

    // return res.status(201).json({
    //   message: "the violation action done"
    // })
     res.status(200).json({
      success: true,
      data: {
        result,
        questions: interview.questions,
      },
    });

  }
  catch (err) {
    res.status(500).json({
      message: `something went wrong :${err}`
    })
  }

}



// const submitInterview = async (req, res) => {
//   try {

//     const interview = await Interview.findById(req.params.id);
//     if (!interview) return res.status(404).json({ message: 'Interview not found' });

//     const existingResult = await Result.findOne({
//       interviewId: interview._id,
//     });

//     if (existingResult) {
//       return res.status(200).json({
//         success: true,
//         resultId: existingResult._id,
//         message: "Result already exists",
//       });
//     }

//     interview.status = 'completed';
//     interview.submittedAt = new Date();
//     await interview.save();

//     // evaluate each answered question
// //     let totalScore = 0;
// //     let answeredCount = 0;

// //     for (const question of interview.questions) {
// //       if (!question.answerText) continue;

// //       const prompt = `You are evaluating a candidate's interview answer.
// // Job role: ${interview.jobRole}
// // Question: ${question.questionText}
// // Candidate's answer: ${question.answerText}

// // Evaluate and return ONLY a valid JSON object, no markdown, no explanation:
// // {
// //   "score": <0-100>,
// //   "relevance": <0-100>,
// //   "clarity": <0-100>,
// //   "feedback": "<one sentence>"
// // }`;

// //       const response = await openai.chat.completions.create({
// //         model: 'gpt-4o',
// //         messages: [{ role: 'user', content: prompt }],
// //       });


// //       await AIUsage.updateOne(
// //         {},
// //         {
// //           $inc: {
// //             totalRequests: 1,
// //             evaluationTokens: response.usage.total_tokens,
// //             resumeTokens: response.usage.total_tokens,
// //             totalTokens: response.usage.total_tokens,
// //           },
// //         }
// //       );

// //       const evaluation = JSON.parse(response.choices[0].message.content.trim());
// //       question.aiEvaluation = evaluation;
// //       totalScore += evaluation.score;
// //       answeredCount++;
// //     }

// // evaluate each answered question (hardcoded)
// let totalScore = 0;
// let answeredCount = 0;

// for (const question of interview.questions) {
//   if (!question.answerText) continue;

//   const evaluation = {
//     score: 80,
//     relevance: 82,
//     clarity: 78,
//     feedback: "Good answer with room for more technical depth."
//   };

//   question.aiEvaluation = evaluation;
//   totalScore += evaluation.score;
//   answeredCount++;
// }

//     interview.status = 'evaluated';
//     await interview.save();
//     await InterviewPost.findByIdAndDelete(
//       interview.postId,
//     );


//     const overallScore = answeredCount > 0
//       ? Math.round(totalScore / answeredCount)
//       : 0;

//     // generate summary
// //     const summaryPrompt = `Based on this interview for ${interview.jobRole}:
// // ${JSON.stringify(interview.questions.map(q => ({
// //       question: q.questionText,
// //       answer: q.answerText,
// //       evaluation: q.aiEvaluation,
// //     })))}

// // Return ONLY a valid JSON object, no markdown, no explanation:
// // {
// //   "strengths": ["<strength 1>", "<strength 2>"],
// //   "weaknesses": ["<weakness 1>", "<weakness 2>"],
// //   "recommendation": "<hire | reject>"
// // }`;

// //     const summaryResponse = await openai.chat.completions.create({
// //       model: 'gpt-4o',
// //       messages: [{ role: 'user', content: summaryPrompt }],
// //     });

// //     const summary = JSON.parse(summaryResponse.choices[0].message.content.trim());

// //     await AIUsage.updateOne(
// //       {},
// //       {
// //         $inc: {
// //           totalRequests: 1,
// //           totalInterviews: 1,
// //           summaryTokens: summaryResponse.usage.total_tokens,
// //           totalTokens: summaryResponse.usage.total_tokens,
// //         },
// //       }
// //     );

// const summary = {
//   strengths: [
//     "Good communication skills",
//     "Demonstrates basic technical knowledge"
//   ],
//   weaknesses: [
//     "Needs deeper understanding of advanced concepts",
//     "Could provide more structured answers"
//   ],
//   recommendation: "hire"
// };

//     const recruiter = await Admin.findById(interview.recruiterId).select("name")

//     const result = await Result.create({
//       interviewId: interview._id,
//       recruiter: recruiter.name,
//       recruiterId: interview.recruiterId,
//       candidateId: interview.candidateId,
//       overallScore: overallScore,
//       summary: {
//         totalQuestions: interview.questions.length,
//         averageScore: overallScore,
//         ...summary,
//       },
//       questions: interview.questions,
//       evaluatedAt: new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       resultId: result._id,
//       message: 'Interview submitted and evaluated',
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



const submitInterview = async (req, res) => {
  try {

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const existingResult = await Result.findOne({
      interviewId: interview._id,
    });

    if (existingResult) {
      return res.status(200).json({
        success: true,
        resultId: existingResult._id,
        message: "Result already exists",
      });
    }

    interview.status = "processing";
    interview.submittedAt = new Date();

    await interview.save();

    // Respond immediately
    res.status(200).json({
      success: true,
      message: "Interview submitted successfully.",
    });

    // ===============================
    // Everything below runs in background
    // ===============================

    try {

      // -------------------------------
      // Upload all videos
      // -------------------------------

      for (const question of interview.questions) {

        if (!question.localRecordingPath) continue;

        const upload = await cloudinary.uploader.upload(
          question.localRecordingPath,
          {
            resource_type: "video",
            folder: "interview-recordings",
          }
        );

        question.recordingUrl = upload.secure_url;

        await fs.unlink(question.localRecordingPath, () => {});

        question.localRecordingPath = null;
      }

      await interview.save();

      // -------------------------------
      // Evaluate every answer
      // -------------------------------

      let totalScore = 0;
      let answeredCount = 0;

      for (const question of interview.questions) {

        if (!question.answerText) continue;

        // Replace this with OpenAI later
        const evaluation = {
          score: 80,
          relevance: 82,
          clarity: 78,
          feedback:
            "Good answer with room for more technical depth.",
        };

        question.aiEvaluation = evaluation;

        totalScore += evaluation.score;
        answeredCount++;

      }

      const overallScore =
        answeredCount > 0
          ? Math.round(totalScore / answeredCount)
          : 0;

      await interview.save();

      // -------------------------------
      // Generate Summary
      // -------------------------------

      const summary = {
        strengths: [
          "Good communication skills",
          "Demonstrates basic technical knowledge",
        ],
        weaknesses: [
          "Needs deeper understanding of advanced concepts",
          "Could provide more structured answers",
        ],
        recommendation: "hire",
      };

      // -------------------------------
      // Recruiter
      // -------------------------------

      const recruiter = await Admin.findById(
        interview.recruiterId
      ).select("name");

      // -------------------------------
      // Create Result
      // -------------------------------

      await Result.create({

        interviewId: interview._id,

        recruiter: recruiter.name,

        recruiterId: interview.recruiterId,

        candidateId: interview.candidateId,

        overallScore,

        summary: {

          totalQuestions: interview.questions.length,

          averageScore: overallScore,

          ...summary,

        },

        questions: interview.questions,

        evaluatedAt: new Date(),

      });

      // -------------------------------
      // Cleanup
      // -------------------------------

      await InterviewPost.findByIdAndDelete(
        interview.postId
      );

      interview.status = "completed";

      await interview.save();

      console.log(
        `Interview ${interview._id} processed successfully.`
      );

    } catch (err) {

      console.error(err);

      interview.status = "failed";

      await interview.save();

    }

  } catch (err) {

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

module.exports = {
  startInterview,
  getNextQuestion,
  saveAnswer,
  interview_violation,
  submitInterview,
  getResult
};