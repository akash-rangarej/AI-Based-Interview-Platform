import { useState } from "react";
import api from "../../../api/axiosClient";
import toast from "react-hot-toast";


const PostInterview = () => {
  const [form, setForm] = useState({
    roundName: "",
    role: "",
    jd: "",
    candidateType: "fresher",
    minExperience: "",
    maxExperience: "",
    difficulty: "medium",
    questions: 10,
    skills: "",
    followUps: true,
    adaptive: true,
    Email: "",
    interviewDate: "",
    startTime: "",
    endTime: "",
    duration: 30,
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // Basic validation
    if (!form.roundName.trim()) {
      setErrorMsg("Please enter the round name.");
      return;
    }
    if (!form.role.trim()) {
      setErrorMsg("Please enter the job role.");
      return;
    }
    if (!form.jd.trim()) {
      setErrorMsg("Please enter the job description.");
      return;
    }
    if (!form.skills.trim()) {
      setErrorMsg("Please enter the required skills.");
      return;
    }
    if (!form.interviewDate) {
      setErrorMsg("Please select an interview date.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setErrorMsg("Please set a start and end time for the interview window.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/interview-posts/post", form);
      
     
        toast.success(`Interview posted! It will be available for candidates.`)

      // Reset form after successful post
      setForm({
        roundName: "",
        role: "",
        jd: "",
        candidateType: "fresher",
        minExperience: "",
        maxExperience: "",
        difficulty: "medium",
        questions: 10,
        skills: "",
        followUps: true,
        adaptive: true,
        Email: "",
        interviewDate: "",
        startTime: "",
        endTime: "",
        duration: 30,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-6 !text-white">AI Interview Setup</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ✅ Fixed: name was "Name of the round" (spaces break req.body) */}
        <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
          Round Name :
          <span className="text-red-500 ml-2">*</span>
        </label>
        <input
          required
          name="roundName"
          value={form.roundName}
          placeholder="Name of the round (e.g. 'Technical Round 1' or 'HR Round')"
          className="w-full h-10 px-3 bg-slate-800 rounded"
          onChange={handleChange}
        />
        <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
          Job Role :
          <span className="text-red-500 ml-2">*</span>
        </label>
        <input
          required
          name="role"
          value={form.role}
          placeholder="Job Role"
          className="w-full h-10 px-3 bg-slate-800 rounded"
          onChange={handleChange}
        />
        <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
          Job Description :
          <span className="text-red-500 ml-2">*</span>
        </label>
        <textarea
          required
          name="jd"
          value={form.jd}
          placeholder="Job Description"
          className="w-full h-48 p-3 bg-slate-800 rounded resize-none overflow-y-auto"
          onChange={handleChange}
        />
        <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
          Skills :
          <span className="text-red-500 ml-2">*</span>
        </label>
        <input
          required
          name="skills"
          value={form.skills}
          placeholder="Skills (comma separated)"
          className="w-full p-2 bg-slate-800 rounded"
          onChange={handleChange}
        />
  
        <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
          Candidate Type :
          <span className="text-red-500 ml-2">*</span>
        </label>
        <select
          name="candidateType"
          value={form.candidateType}
          className="w-full h-10 p-2 bg-slate-800 rounded"
          onChange={handleChange}
        >
          <option value="fresher">Fresher</option>
          <option value="experienced">Experienced</option>
        </select>

        {form.candidateType === "experienced" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Min Experience (Years)</label>
              <select
                name="minExperience"
                value={form.minExperience}
                className="w-full h-10 p-2 bg-slate-800 rounded"
                onChange={handleChange}
              >
                <option value="">Select</option>
                {[...Array(16)].map((_, i) => (
                  <option key={i} value={i}>{i} Years</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">Max Experience (Years)</label>
              <select
                name="maxExperience"
                value={form.maxExperience}
                className="w-full h-10 p-2 bg-slate-800 rounded"
                onChange={handleChange}
              >
                <option value="">Select</option>
                {[...Array(16)].map((_, i) => (
                  <option key={i} value={i}>{i} Years</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <select
          name="difficulty"
          value={form.difficulty}
          className="w-full h-10 p-2 bg-slate-800 rounded"
          onChange={handleChange}
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>

        <input
          name="questions"
          type="number"
          value={form.questions}
          placeholder="Number of Questions"
          className="w-full p-2 bg-slate-800 rounded"
          onChange={handleChange}
        />

        <input
          required
          name="Email"
          type="email"
          value={form.Email}
          placeholder="Candidate's email to send interview details (e.g. john@gmail.com)"
          className="w-full p-2 bg-slate-800 rounded"
          onChange={handleChange}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="followUps"
            onChange={handleChange}
            checked={form.followUps}
          />
          Enable Follow-up Questions
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="adaptive"
            onChange={handleChange}
            checked={form.adaptive}
          />
          Adaptive Difficulty
        </label>

         <div className="border-t border-slate-700 pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3 text-white">Interview Window</h3>

          <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
            Interview Date :
            <span className="text-red-500 ml-2">*</span>
          </label>
          <input
            required
            type="date"
            name="interviewDate"
            value={form.interviewDate}
            min={new Date().toISOString().split("T")[0]}
            className="w-full h-10 px-3 bg-slate-800 rounded"
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
                Window Start :
                <span className="text-red-500 ml-2">*</span>
              </label>
              <input
                required
                type="time"
                name="startTime"
                value={form.startTime}
                className="w-full h-10 px-3 bg-slate-800 rounded"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-2 flex items-center text-sm font-medium text-slate-300">
                Window End :
                <span className="text-red-500 ml-2">*</span>
              </label>
              <input
                required
                type="time"
                name="endTime"
                value={form.endTime}
                className="w-full h-10 px-3 bg-slate-800 rounded"
                onChange={handleChange}
              />
            </div>
          </div>

          <label className="mb-2 flex items-center text-sm font-medium text-slate-300 mt-3">
            Interview Duration (minutes) :
            <span className="text-red-500 ml-2">*</span>
          </label>
          <select
            name="duration"
            value={form.duration}
            className="w-full h-10 p-2 bg-slate-800 rounded"
            onChange={handleChange}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes (1.5 hours)</option>
            <option value={120}>120 minutes (2 hours)</option>
            <option value={150}>150 minutes (2.5 hours)</option>
            <option value={180}>180 minutes (3 hours)</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            The candidate will pick a {form.duration}-minute slot within this window.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors cursor-pointer"
        >
          {loading ? "Posting..." : "Generate Interview"}
        </button>

      </form>
    </div>
  );
};

export default PostInterview;
