import React, { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

const RecruitersTable = () => {
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const { data } = await api.get("/admin/recruiters", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAllRecruiters(data.recruiters || []);
      setResults(data.recruiters || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    let filtered = allRecruiters;

    if (filters.name) {
      filtered = filtered.filter((recruiter) =>
        recruiter.name
          ?.toLowerCase()
          .includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      filtered = filtered.filter((recruiter) =>
        recruiter.email
          ?.toLowerCase()
          .includes(filters.email.toLowerCase())
      );
    }

    if (filters.phone) {
      filtered = filtered.filter((recruiter) =>
        recruiter.ph_no?.includes(filters.phone)
      );
    }

    setResults(filtered);
  };

  const handleDeleteRecruiter = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this recruiter?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`/admin/recruiters/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    setAllRecruiters((prev) =>
      prev.filter((recruiter) => recruiter._id !== id)
    );

    setResults((prev) =>
      prev.filter((recruiter) => recruiter._id !== id)
    );
  } catch (error) {
    console.error(error);
  }
};

  const handleReset = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
    });

    setResults(allRecruiters);
  };

  if (loading) {
    return (
      <div className="text-slate-400 text-center">
        Loading Recruiters...
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-5xl font-bold mb-8">
        View Recruiters
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
        Showing {results.length} of {allRecruiters.length} recruiters
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {results.map((recruiter) => (
          <div
            key={recruiter._id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-4"
          >
            <h2 className="text-xl font-semibold">
              {recruiter.name}
            </h2>

            <p className="text-slate-400 mt-2">
              {recruiter.email}
            </p>

            <p className="text-slate-400">
              {recruiter.ph_no}
            </p>

                                <button
                    onClick={() => handleDeleteRecruiter(recruiter._id)}
                    className="mt-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                    >
                    Delete
                    </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruitersTable;