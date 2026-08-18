import { useEffect, useRef, useState } from "react";
import { UserPlus, Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosClient";

const RecruitersTable = () => {
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
  });

  // Uncontrolled inputs via useRef
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const otpRef = useRef(null);

  const fetchRecruiters = async () => {
    try {
      const { data } = await api.get("/admin/recruiters");
      setAllRecruiters(data.recruiters || []);
      setResults(data.recruiters || []);
    } catch (error) {
      toast.error(data.message)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleVerifyEmail = async () => {
    const email = emailRef.current?.value.trim();
    if (!email) {
      toast.error("Please enter an email first.");
      return;
    }

    try {
      const { data } = await api.post("/auth/verify-email", { email });
      toast.success(data.message || "Email verification initiated.");

      setShowOtp(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate email verification.");
    } 
  };

  const handleOtpSubmit = async () => {
    try {
      const email = emailRef.current?.value.trim();
      const otp = otpRef.current?.value.trim();

      if (!email || !otp) {
        toast.error("Please enter both email and OTP.");
        return;
      }

      const { data } = await api.post("/auth/verify-email-otp", {
        email,
        otp,
      });

      toast.success(data.message || "Email verified successfully.");
      setIsEmailVerified(true);
      setShowOtp(false);
    } catch (error) {
      toast.error("Failed to verify OTP.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = nameRef.current?.value.trim();
    const email = emailRef.current?.value.trim();

    if (!email) return;

    if (!isEmailVerified) {
      toast.error("Please verify the email before adding a recruiter.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/add-recruiter", {
        name,
        email,
      });

      formRef.current?.reset();
      setIsEmailVerified(false);
      setShowOtp(false);

      fetchRecruiters();

      toast.success(data.message || "Recruiter added successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add recruiter.");
    } finally {
      setSubmitting(false);
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
        recruiter.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      filtered = filtered.filter((recruiter) =>
        recruiter.email?.toLowerCase().includes(filters.email.toLowerCase())
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
      await api.delete(`/admin/recruiters/${id}`);

      setAllRecruiters((prev) => prev.filter((recruiter) => recruiter._id !== id));
      setResults((prev) => prev.filter((recruiter) => recruiter._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    setFilters({
      name: "",
      email: "",
    });

    setResults(allRecruiters);
  };

  if (loading) {
    return (
      <div className="text-slate-400 text-center">Loading Recruiters...</div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-5xl font-bold mb-8">View Recruiters</h1>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Recruiter</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Full name</span>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <UserPlus size={18} className="shrink-0" />
              <input
                ref={nameRef}
                type="text"
                name="name"
                placeholder="Recruiter's full name"
                autoComplete="name"
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                required
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            <span>Email</span>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <Mail size={18} className="shrink-0" />
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder="name@example.com"
                autoComplete="email"
                onChange={() => {
                  setIsEmailVerified(false);
                  setShowOtp(false);
                  if (otpRef.current) otpRef.current.value = "";
                }}
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                required
              />
            </div>
          </label>

          {isEmailVerified ? (
            <span className="text-sm font-bold text-green-500">
              ✓ Email Verified
            </span>
          ) : (
            <button
              type="button"
              className="cursor-pointer w-fit border-0 bg-transparent text-sm font-bold text-teal-300 hover:text-teal-200"
              onClick={handleVerifyEmail}
            >
              Send OTP
            </button>
          )}

          {showOtp && (
            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              <span>Enter OTP</span>
              <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-500/30 bg-slate-950/50 px-3 text-slate-400 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
                <KeyRound size={18} className="shrink-0" />
                <input
                  ref={otpRef}
                  type="text"
                  name="otp"
                  placeholder="Enter the OTP"
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                  required
                />
              </div>
              <button
                type="button"
                className="cursor-pointer w-fit border-0 bg-transparent text-sm font-bold text-teal-300 hover:text-teal-200 outline-black"
                onClick={handleOtpSubmit}
              >
                Verify OTP
              </button>
            </label>
          )}

          <button
            type="submit"
            className="cursor-pointer flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 text-sm font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Adding recruiter..." : "Add Recruiter"}
          </button>
        </form>
      </div>

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
            <h2 className="text-xl font-semibold">{recruiter.name}</h2>
            <p className="text-slate-400 mt-2">{recruiter.email}</p>

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