const AIUsageAnalytics = () => {
  const analytics = {
    totalRequests: 2450,
    totalInterviews: 510,
    totalTokens: "1.35M",
    estimatedCost: "$4.65",

    resumeTokens: "120K",
    questionTokens: "450K",
    evaluationTokens: "780K",
  };

  return (
    <div className="text-white p-6">
      <h1 className="text-4xl font-bold mb-8">
        AI Usage Analytics
      </h1>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="text-slate-400">Total Requests</h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.totalRequests}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="text-slate-400">Interviews Completed</h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.totalInterviews}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="text-slate-400">Tokens Used</h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.totalTokens}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h3 className="text-slate-400">Estimated Cost</h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.estimatedCost}
          </p>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-5">
          Token Usage Breakdown
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-700 pb-3">
            <span>Resume Extraction</span>
            <span>{analytics.resumeTokens}</span>
          </div>

          <div className="flex justify-between border-b border-slate-700 pb-3">
            <span>Question Generation</span>
            <span>{analytics.questionTokens}</span>
          </div>

          <div className="flex justify-between">
            <span>Answer Evaluation</span>
            <span>{analytics.evaluationTokens}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-5">
          Usage Summary
        </h2>

        <div className="space-y-3 text-lg">
          <p>
            <strong>Total Requests:</strong>{" "}
            {analytics.totalRequests}
          </p>

          <p>
            <strong>Total Interviews:</strong>{" "}
            {analytics.totalInterviews}
          </p>

          <p>
            <strong>Total Tokens:</strong>{" "}
            {analytics.totalTokens}
          </p>

          <p>
            <strong>Estimated Cost:</strong>{" "}
            {analytics.estimatedCost}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIUsageAnalytics;