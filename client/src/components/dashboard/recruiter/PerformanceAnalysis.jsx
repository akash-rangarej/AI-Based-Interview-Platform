import { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

export default function PerformancePage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get("/recruiter/performance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce(
            (sum, r) => sum + r.overallScore,
            0
          ) / results.length
        )
      : 0;

  const handleDeleteResult = async(resultID)=>{
      try{
          const res = await api.delete(`/recruiter/delete-result/${resultID}`,{
            headers:{Authorization: `Bearer ${localStorage.getItem('token')}`}
          })
          if (res.status == 200){
             setResults(prev =>
    prev.filter(result => result._id !== resultID)
  );
          }
        }catch(err){
        console.log("error:",err)
      }
  }

  const hireCount = results.filter(
    (r) =>
      r.summary?.recommendation?.toLowerCase() === "hire"
  ).length;

  if (loading) {
    return (
      <div className="text-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Candidate Performance
        </h1>

        <p className="text-slate-400 mt-1">
          Track candidate interview performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Total Candidates
          </p>

          <h2 className="text-3xl font-bold text-white">
            {results.length}
          </h2>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Average Score
          </p>

          <h2 className="text-3xl font-bold text-emerald-400">
            {avgScore}
          </h2>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Hire Recommended
          </p>

          <h2 className="text-3xl font-bold text-sky-400">
            {hireCount}
          </h2>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Rejected
          </p>

          <h2 className="text-3xl font-bold text-red-400">
            {results.length - hireCount}
          </h2>
        </div>

      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-900">

              <tr>
                <th className="text-left p-4">Candidate</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Score</th>
                <th className="text-left p-4">Recommendation</th>
                <th className="text-left p-4">Action</th>
              </tr>

            </thead>

            <tbody>

              {results.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-slate-700"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-white">
                        {item.candidateId?.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {item.candidateId?.email}
                      </p>
                    </div>
                  </td>

                  <td className="p-4">
                    {item.interviewId?.jobRole}
                  </td>

                  <td className="p-4">
                    {item.overallScore}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.summary?.recommendation ===
                        "hire"
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {item.summary?.recommendation}
                    </span>

                  </td>

                  <td className="p-4">

                    <button
                      onClick={() =>
                        setSelectedCandidate(item)
                      }
                      className="bg-indigo-600 px-3 py-2 rounded-lg"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteResult(item._id)
                      }
                      className="bg-red-600 px-3 py-2 rounded-lg"
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* Modal */}

      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">

          <div className="bg-slate-900 rounded-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center">

              <h2 className="text-2xl font-bold">
                Candidate Report
              </h2>

              <button
                onClick={() =>
                  setSelectedCandidate(null)
                }
              >
                ✕
              </button>

            </div>

            <div className="mt-6 space-y-4">

              <div>
                <h3 className="font-semibold">
                  Overall Score
                </h3>

                <p className="text-3xl text-emerald-400">
                  {selectedCandidate.overallScore}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Strengths
                </h3>

                <ul className="list-disc ml-5">
                  {selectedCandidate.summary?.strengths?.map(
                    (s, i) => (
                      <li key={i}>{s}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold">
                  Weaknesses
                </h3>

                <ul className="list-disc ml-5">
                  {selectedCandidate.summary?.weaknesses?.map(
                    (s, i) => (
                      <li key={i}>{s}</li>
                    )
                  )}
                </ul>
              </div>
              <div>
  <h3 className="font-semibold text-xl mb-4">
    Question-wise Analysis
  </h3>

  <div className="space-y-5">
    {selectedCandidate.questions?.map((q, index) => (
      <div
        key={q._id}
        className="border border-slate-700 rounded-lg p-4"
      >
        <h4 className="font-semibold text-white">
          Q{index + 1}. {q.questionText}
        </h4>

        <p className="text-slate-400 mt-2">
          {q.answerText || "No answer provided"}
        </p>

        {q.aiEvaluation && (
          <div className="mt-3 grid md:grid-cols-3 gap-3">

            <div className="bg-slate-800 p-3 rounded">
              <p className="text-xs text-slate-400">
                Score
              </p>
              <p className="text-lg font-bold">
                {q.aiEvaluation.score}
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded">
              <p className="text-xs text-slate-400">
                Relevance
              </p>
              <p className="text-lg font-bold">
                {q.aiEvaluation.relevance}
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded">
              <p className="text-xs text-slate-400">
                Clarity
              </p>
              <p className="text-lg font-bold">
                {q.aiEvaluation.clarity}
              </p>
            </div>

          </div>
        )}

        {q.aiEvaluation?.feedback && (
          <div className="mt-3 text-sky-300">
            Feedback: {q.aiEvaluation.feedback}
          </div>
        )}
          
        {q.recordingUrl && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-400">
              Candidate Recording
            </p>

            <video
              controls
              className="w-full rounded-lg"
            >
              <source
                src={q.recordingUrl}
                type="video/webm"
              />
            </video>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}