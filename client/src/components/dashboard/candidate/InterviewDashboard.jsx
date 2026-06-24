import React, { useEffect, useState } from "react";
import api from "../../../api/axiosClient";


const TimeLeft = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft("Expiring soon"); return; }
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const hrs  = Math.floor(diff / 1000 / 60 / 60);
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`);
    };
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return <span className="text-xs text-yellow-400 font-medium">{timeLeft}</span>;
};

const CandidateDashboard = ({onAttend}) => {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");

        // ── Debug checks ──────────────────────────────
        if (!token) {
          setError("You are not logged in. Please login again.");
          setLoading(false);
          return;
        }
        // ─────────────────────────────────────────────

        const { data } = await api.get("/interview-posts/dashboard", {
    
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("data",data)

        setPosts(data.posts || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        // Show the exact error from backend
        const msg = err.response?.data?.message || err.message || "Failed to load interviews.";
        const status = err.response?.status;

        if (status === 401) {
          setError("Session expired. Please login again.");
        } else if (status === 403) {
          setError("Access denied. Only candidates can view this page.");
        } else {
          setError(`Error: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleAttend = (postId) => {
    window.location.href = `/interview/${postId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-400">
        Loading interviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-6">Available Interviews</h2>

      {posts.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-10 text-center text-slate-400">
          No interviews available right now.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-slate-800 rounded-lg p-5 flex items-center justify-between gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-semibold">{post.role}</h3>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {post.roundName}
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.skills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-2">
                  <span>
                    {post.candidateType === "fresher"
                      ? "Fresher"
                      : `${post.minExperience}–${post.maxExperience} yrs`}
                  </span>
                </div>

                <TimeLeft expiresAt={post.expiresAt} />
              </div>

              {/* Button */}
              <button
                onClick={() => onAttend(post)}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Start Interview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;