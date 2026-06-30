const Interview = require('../models/Interview');
const Result    = require('../models/Result');
const InterviewPost = require('../models/interviewpost')
const OpenAI    = require('openai');
const cloudinary = require("../config/cloudinary")
const fs = require("fs")
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AIUsage = require("../models/AIUsage");

// ── Start Interview + Generate All Questions ───────────────────
const startInterview = async (req, res) => {
  try {

    const { jobRole, jobDescription, skills, difficulty, numberOfQuestions, postId} = req.body;
    const candidateId = req.user.id;
    // generate all questions at once
    const prompt = `You are conducting a ${difficulty} level job interview for the role of ${jobRole}.
    Job description: ${jobDescription}
    Required skills: ${skills.join(', ')}
    
    Generate exactly ${numberOfQuestions} interview questions following these rules:
    1. Question 1 must always be: "Tell me about yourself"
    2. Questions 2-4 should be technical questions based on the job role and required skills.
    3. Question 5 should be a behavioral/situational question.
    4. Question 6 should be: "Do you have any questions for us?"
    5. Do not repeat any question.
    6. Keep questions clear and concise.
    
    Return ONLY a valid JSON array of 6 objects, nothing else. No markdown, no explanation.
    Format:
    [
      { "questionText": "...", "category": "introduction", "difficulty": "easy" },
      { "questionText": "...", "category": "technical", "difficulty": "medium" },
      { "questionText": "...", "category": "technical", "difficulty": "medium" },
      { "questionText": "...", "category": "technical", "difficulty": "hard" },
      { "questionText": "...", "category": "behavioral", "difficulty": "medium" },
      { "questionText": "...", "category": "wrap-up", "difficulty": "easy" }
      ]`;
      
      const response = await openai.chat.completions.create({
        model:    'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });

            await AIUsage.findOneAndUpdate(
      {},
      {
        $inc: {
          totalRequests: 1,
          questionTokens: response.usage.total_tokens,
          totalTokens: response.usage.total_tokens,
        },
      }
    );

          

      console.log("Question Generation:", response.usage);
      
      let raw       = response.choices[0].message.content.trim();
      raw = raw
  .replace(/```json\s*/gi, "")
  .replace(/```\s*/g, "")
  .trim();
      const parsed    = JSON.parse(raw);
      
      // build questions array with orderIndex
      const questions = parsed.map((q, i) => ({
        questionText: q.questionText,
        category:     q.category,
        difficulty:   q.difficulty,
        orderIndex:   i + 1,
      }));
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
      status:    'in_progress',
      startedAt: new Date(),
      questions,             // all 6 stored upfront
    });

    res.status(201).json({
      success:     true,
      interviewId: interview._id,
      message:     'Interview started',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Next Question (just fetch from DB, no AI call) ─────────
const getNextQuestion = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // find the next unanswered question
    const nextQuestion = interview.questions.find((q) => !q.answeredAt);

    if (!nextQuestion) {
      return res.status(200).json({
        success:  true,
        question: null,
        message:  'All questions answered',
      });
    }

    res.status(200).json({
      success:  true,
      question: {
        _id:          nextQuestion._id,
        questionText: nextQuestion.questionText,
        category:     nextQuestion.category,
        difficulty:   nextQuestion.difficulty,
        orderIndex:   nextQuestion.orderIndex,
      },
      totalQuestions: interview.questions.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const uploadRecording = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video uploaded",
      });
    }

    const result = await cloudinary.uploader.upload(
      req.file.path,
      {
        resource_type: "video",
        folder: "interview-recordings",
      }
    );

    fs.unlink(req.file.path, (err) => {
  if (err) console.error(err);
  });
console.log("Cloudinary Upload Result:", result);
    res.status(200).json({
      success: true,
      recordingUrl: result.secure_url,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── Save Answer ────────────────────────────────────────────────
const saveAnswer = async (req, res) => {
  try {
    const { questionId, answerText, recordingUrl } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const question = interview.questions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.answerText   = answerText;
    question.recordingUrl = recordingUrl;
    question.answeredAt   = new Date();

    await interview.save();

    res.status(200).json({ success: true, message: 'Answer saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Submit & Evaluate ──────────────────────────────────────────
const submitInterview = async (req, res) => {
  try {
    
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

    interview.status      = 'completed';
    interview.submittedAt = new Date();
    await interview.save();

    // evaluate each answered question
    let totalScore = 0;
    let answeredCount = 0;

    for (const question of interview.questions) {
      if (!question.answerText) continue;

      const prompt = `You are evaluating a candidate's interview answer.
Job role: ${interview.jobRole}
Question: ${question.questionText}
Candidate's answer: ${question.answerText}

Evaluate and return ONLY a valid JSON object, no markdown, no explanation:
{
  "score": <0-100>,
  "relevance": <0-100>,
  "clarity": <0-100>,
  "feedback": "<one sentence>"
}`;

      const response = await openai.chat.completions.create({
        model:    'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });

      console.log("Answer Evaluation:", response.usage);

      await AIUsage.updateOne(
  {},
  {
    $inc: {
      totalRequests: 1,
      evaluationTokens: response.usage.total_tokens,
      resumeTokens: response.usage.total_tokens,
      totalTokens: response.usage.total_tokens,
    },
  }
);

      const evaluation      = JSON.parse(response.choices[0].message.content.trim());
      question.aiEvaluation = evaluation;
      totalScore           += evaluation.score;
      answeredCount++;
    }

    interview.status = 'evaluated';
    await interview.save();
    await InterviewPost.findByIdAndUpdate(
  interview.postId,
  {
    status: "completed"
  }
);


    const overallScore = answeredCount > 0
      ? Math.round(totalScore / answeredCount)
      : 0;

    // generate summary
    const summaryPrompt = `Based on this interview for ${interview.jobRole}:
${JSON.stringify(interview.questions.map(q => ({
  question:   q.questionText,
  answer:     q.answerText,
  evaluation: q.aiEvaluation,
})))}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendation": "<hire | reject>"
}`;

    const summaryResponse = await openai.chat.completions.create({
      model:    'gpt-4o',
      messages: [{ role: 'user', content: summaryPrompt }],
    });
    
    console.log("Summary Generation:", summaryResponse.usage);
    const summary = JSON.parse(summaryResponse.choices[0].message.content.trim());

        await AIUsage.updateOne(
  {},
  {
    $inc: {
      totalRequests: 1,
      totalInterviews: 1,
      summaryTokens: summaryResponse.usage.total_tokens,
      totalTokens: summaryResponse.usage.total_tokens,
    },
  }
);
 
    
       
    const result = await Result.create({
      interviewId:  interview._id,
      candidateId:  interview.candidateId,
      overallScore,
      summary: {
        totalQuestions: interview.questions.length,
        averageScore:   overallScore,
        ...summary,
      },
      questions : interview.questions,
      evaluatedAt: new Date(),
    });

    res.status(200).json({
      success:  true,
      resultId: result._id,
      message:  'Interview submitted and evaluated',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Result ─────────────────────────────────────────────────
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
  submitInterview,
  getResult,
  uploadRecording
};