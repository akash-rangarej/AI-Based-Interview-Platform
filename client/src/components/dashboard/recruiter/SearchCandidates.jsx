import React, { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

const SearchCandidates = () => {
  const [allCandidates, setAllCandidates] = useState([]); // original list from API
  const [results, setResults]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [filters, setFilters]             = useState({
    name:     "",
    skill:    "",
    minExp:   "",
  });

  // Fetch all candidates once on mount
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data } = await api.get("/users/candidates", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAllCandidates(data.candidates || []);
        setResults(data.candidates || []);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load candidates.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    let filtered = allCandidates;

    if (filters.name) {
      filtered = filtered.filter((c) =>
        c.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.skill) {
      filtered = filtered.filter((c) =>
        c.skills?.some((s) =>
          s.toLowerCase().includes(filters.skill.toLowerCase())
        )
      );
    }

    if (filters.minExp) {
      filtered = filtered.filter(
        (c) => (c.experience?.length || 0) >= Number(filters.minExp)
      );
    }

    setResults(filtered);
  };

  const handleReset = () => {
    setFilters({ name: "", skill: "", minExp: "" });
    setResults(allCandidates);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-400">
        Loading candidates...
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
      <h1 className="text-2xl font-bold mb-6">🔎 Search Candidates</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-xl">
        <input
          name="name"
          value={filters.name}
          onChange={handleChange}
          placeholder="Search by name"
          className="p-2 bg-slate-800 rounded outline-none"
        />
        <input
          name="skill"
          value={filters.skill}
          onChange={handleChange}
          placeholder="Search by skill (React, Python...)"
          className="p-2 bg-slate-800 rounded outline-none"
        />
        <input
          name="minExp"
          value={filters.minExp}
          onChange={handleChange}
          placeholder="Min experiences count"
          type="number"
          className="p-2 bg-slate-800 rounded outline-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSearch}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Total count */}
      <p className="text-slate-400 text-sm mt-4">
        Showing {results.length} of {allCandidates.length} candidates
      </p>

      {/* Results */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {results.length === 0 ? (
          <p className="text-gray-400">No candidates found.</p>
        ) : (
          results.map((c, i) => (
            <div
              key={c._id || i}
              className="bg-slate-900 p-4 rounded-xl border border-slate-700"
            >
              {/* Name + profile badge */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold">{c.name || "N/A"}</h2>
                {c.profileCompleted && (
                  <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full">
                    Profile Complete
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-2">{c.email}</p>

              {/* Skills */}
              {c.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.skills.map((skill, j) => (
                    <span
                      key={j}
                      className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Experience */}
              {c.experience?.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1">Experience:</p>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {c.experience.map((exp, j) => (
                      <li key={j}>{exp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Education */}
              {c.education?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Education:</p>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {c.education.map((edu, j) => (
                      <li key={j}>{edu}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchCandidates;