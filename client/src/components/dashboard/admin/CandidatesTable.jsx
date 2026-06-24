import React, { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

const CandidatesTable = () => {
  const [allCandidates, setAllCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
  const fetchCandidates = async () => {
    try {
      const { data } = await api.get("/admin/candidates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Candidates API Response:", data);

      setAllCandidates(data.candidates || []);
      setResults(data.candidates || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchCandidates(); // IMPORTANT
}, []);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    let filtered = allCandidates;

    if (filters.name) {
      filtered = filtered.filter((candidate) =>
        candidate.name
          ?.toLowerCase()
          .includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      filtered = filtered.filter((candidate) =>
        candidate.email
          ?.toLowerCase()
          .includes(filters.email.toLowerCase())
      );
    }

    if (filters.phone) {
      filtered = filtered.filter((candidate) =>
        candidate.ph_no?.includes(filters.phone)
      );
    }

    setResults(filtered);
  };

  const handleReset = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
    });

    setResults(allCandidates);
  };

  if (loading) {
    return (
      <div className="text-slate-400 text-center">
        Loading Candidates...
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-5xl font-bold mb-8">
        View Candidates
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          name="name"
          placeholder="Search by Name"
          value={filters.name}
          onChange={handleChange}
          className="bg-slate-800 border border-slate-700 rounded-lg p-3"
        />

        <input
          type="text"
          name="email"
          placeholder="Search by Email"
          value={filters.email}
          onChange={handleChange}
          className="bg-slate-800 border border-slate-700 rounded-lg p-3"
        />

        <input
          type="text"
          name="phone"
          placeholder="Search by Phone Number"
          value={filters.phone}
          onChange={handleChange}
          className="bg-slate-800 border border-slate-700 rounded-lg p-3"
        />
      </div>

      <div className="flex gap-3 mb-5">
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
        >
          Search
        </button>

        <button
          onClick={handleReset}
          className="bg-slate-600 hover:bg-slate-700 px-5 py-2 rounded-lg"
        >
          Reset
        </button>
      </div>

      <p className="text-slate-400 mb-5">
        Showing {results.length} of {allCandidates.length} candidates
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {results.map((candidate) => (
          <div
            key={candidate._id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-4"
          >
            <h2 className="text-xl font-semibold">
              {candidate.name}
            </h2>

            <p className="text-slate-400 mt-2">
              {candidate.email}
            </p>

            <p className="text-slate-400">
              {candidate.ph_no}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidatesTable;