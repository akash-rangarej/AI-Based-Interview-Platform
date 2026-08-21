const Interview = require("../../src/models/Interview");
const Result = require("../../src/models/result");
const Admin = require("../../src/models/Admin");
const InterviewPost = require("../../src/models/interviewpost");
const interviewViolation = require("../../src/models/interviewViolation");
const AIUsage = require("../../src/models/AIUsage")
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const finalizeInterview = async (interviewId) => {

  const interview =
    await Interview.findById(interviewId);

  if (!interview)
    throw new Error("Interview not found");

  if (interview.status === "completed")
    return;

  const existing =
    await Result.findOne({
      interviewId,
    });

  if (existing){
      return
    }
    
    //   interview.status = "evaluating";
    
    //   await interview.save();
    
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
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });


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

      const evaluation = JSON.parse(response.choices[0].message.content.trim());
      question.aiEvaluation = evaluation;
      totalScore += evaluation.score;
      answeredCount++;
    }

    await interview.save();

  
      const overallScore = answeredCount > 0
      ? Math.round(totalScore / answeredCount)
      : 0;

    // generate summary
    const summaryPrompt = `Based on this interview for ${interview.jobRole}:
${JSON.stringify(interview.questions.map(q => ({
      question: q.questionText,
      answer: q.answerText,
      evaluation: q.aiEvaluation,
    })))}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendation": "<hire | reject>"
}`;

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: summaryPrompt }],
    });

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
    
  
  const recruiter =
  await Admin.findById(
    interview.recruiterId
  ).select("name");
  
  await Result.create({
    
    interviewId: interview._id,
    
    recruiter: recruiter.name,
    
    recruiterId: interview.recruiterId,
    
    candidateId: interview.candidateId,
    
    overallScore,
    
    summary: {
      
      totalQuestions:
      interview.questions.length,
      
      averageScore:
      overallScore,
      
      ...summary,
      
    },
    
    questions:
    interview.questions,
    
    evaluatedAt:
    new Date(),
    
  });
  
  await InterviewPost.findByIdAndDelete(
    interview.postId
  );
  
  interview.status = "completed";

  await interview.save();

  await interviewViolation.findOneAndDelete({interviewId})

  console.log(
    `Interview ${interview._id} finalized successfully`
  );

};

module.exports = finalizeInterview;