import React, { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

const statusColors = {
  active:    "bg-emerald-900 text-emerald-300",
  cancelled: "bg-red-900 text-red-300",
  completed: "bg-blue-900 text-blue-300",
};

const RecruiterDashboard = () => {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get("/interview-posts/my-posts", {
    
        });


        setPosts(data.posts || []);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load your posts.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    const confirmed = window.confirm("Are you sure you want to delete this interview post?");
    if (!confirmed) return;

    setDeleting(postId);
    try {
      await api.delete(`/interview-posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-400">
        Loading your posts...
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
      <h2 className="text-2xl font-bold mb-6">My Interview Posts</h2>

      {posts.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-10 text-center text-slate-400">
          You haven't posted any interviews yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="bg-slate-800 rounded-lg p-5">

              {/* Top row */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{post.role}</h3>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {post.roundName}
                  </span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${statusColors[post.status] || "bg-slate-700 text-slate-300"}`}>
                  {post.status}
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.skills?.map((skill, i) => (
                  <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-3">
                <span>
                  {post.candidateType === "fresher"
                    ? "Fresher"
                    : `${post.minExperience}–${post.maxExperience} yrs`}
                </span>
                <span>· <span className="capitalize">{post.difficulty}</span> difficulty</span>
                <span>· {post.numberOfQuestions} questions</span>
                {post.candidateEmail && (
                  <span>· Sent to: <span className="text-slate-300">{post.candidateEmail}</span></span>
                )}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Posted: {formatDate(post.createdAt)}</span>
                  {post.expiresAt && <span>Expires: {formatDate(post.expiresAt)}</span>}
                </div>

                <button
                  onClick={() => handleDelete(post._id)}
                  disabled={deleting === post._id}
                  className="text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  {deleting === post._id ? "Deleting..." : "Delete"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;