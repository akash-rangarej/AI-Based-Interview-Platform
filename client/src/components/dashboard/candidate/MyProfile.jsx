import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import api from "../../../api/axiosClient";

const MyProfile = ({ user }) => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError]     = useState("");
const [saveSuccess, setSaveSuccess] = useState("");

 const [profileData, setProfileData] = useState({
  name: "",
  phone: "",
  email: "",

  skills: [],

  education: [
    {
      institution: "",
      degree: "",
      years: "",
      location: "",
      gpa: "",  
    },
  ],

  projects: [
    {
      title: "",
      technologies: [],
      description: "",
    },
  ],

  experience: [
    {
      designation: "",
      company: "",
      dates: "",
      description: [],
    },
  ],

  certifications: [],
});

const formatArrayForInput = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return value || "";
};

const parseCommaSeparated = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDescriptionForInput = (value) => {
  if (Array.isArray(value)) {
    return value.join("\n");
  }
  return value || "";
};

const parseDescriptionInput = (value) =>
  value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const handleResumeUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setResume(file);
  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("resume", file);

    const token = localStorage.getItem("token");

    const response = await api.post(
      "/candidate/upload-resume",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      }
    );

    const parsedData = response.data?.profileData;

    setProfileData({
      name: parsedData.name || "",
      phone: parsedData.phone || "",
      email: parsedData.email || "",
      skills: parsedData.skills || [],
      education:
        parsedData.education?.length > 0
          ? parsedData.education
          : [
              {
                institution: "",
                degree: "",
                years: "",
                location: "",
                gpa: "",
              },
            ],
      projects:
        parsedData.projects?.length > 0
          ? parsedData.projects
          : [
              {
                title: "",
                technologies: [],
                description: "",
              },
            ],
      experience:
        parsedData.experience?.length > 0
          ? parsedData.experience
          : [
              {
                designation: "",
                company: "",
                dates: "",
                description: [],
              },
            ],
      certifications:
        parsedData.certifications || [],
    
    });

  } catch (error) {
    console.error(error);
    alert("Failed to parse resume.");
  } finally {
    setLoading(false);
  }
};

  const removeResume = () => {
    setResume(null);
  };

  const handlePersonalChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  const handleSaveProfile = async () => {
  setSaveError("");
  setSaveSuccess("");

  try {
    const token = localStorage.getItem("token");

    await api.post(
      "/candidate/profile",
      {
        name:             profileData.name,
        phone:            profileData.phone,
        email:            profileData.email,
        skills:           profileData.skills,
        education:        profileData.education.map((edu) =>
                            `${edu.degree} at ${edu.institution}, ${edu.location} (${edu.years}) - GPA: ${edu.gpa}`
                          ),
        experience:       profileData.experience.map((exp) =>
                            `${exp.designation} at ${exp.company} (${exp.dates})`
                          ),
        projects:         profileData.projects.map((proj) =>
                            `${proj.title} - ${proj.technologies.join(", ")}: ${proj.description}`
                          ),
        certifications:   profileData.certifications,
        profileCompleted: true,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setSaveSuccess("Profile saved successfully!");

  } catch (err) {
    // This shows the exact message from backend
    // "Email is already in use" or "Phone number is already in use"
    const msg = err.response?.data?.message || "Failed to save profile.";
    setSaveError(msg);
  }
};
  return (
    <div className="space-y-6">


      {/* Resume Upload */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

                <h1 className="text-3xl font-bold text-white mb-2">
                  My Profile
                </h1>

                <p className="text-slate-400 text-sm mb-6">
                  Upload your latest resume for AI-powered analysis.
                </p>

                {loading ? (
          <div className="border-2 border-dashed border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-4">

            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>

            <h3 className="text-white font-semibold">
              Parsing Resume...
            </h3>

            <p className="text-slate-400 text-sm text-center">
              Please wait while Gemini extracts your profile information.
            </p>

          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all">

            <UploadCloud className="w-10 h-10 text-indigo-400" />

            <div className="text-center">
              <p className="text-slate-300 font-medium">
                Drag & Drop Resume
              </p>

              <p className="text-slate-500 text-sm">
                PDF, DOCX, JPEG, JPG, PNG (Max 10MB)
              </p>
            </div>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpeg,.jpg,.png"
              className="hidden"
              onChange={handleResumeUpload}
            />
          </label>
          
        )}

      

        {resume && (
          <div className="mt-6 flex items-center justify-between bg-slate-800/50 rounded-lg p-4">

            <div className="flex items-center gap-3">
              <FileText className="text-green-400" />

              <span className="text-slate-200">
                {resume.name}
              </span>
            </div>

            <button
              onClick={removeResume}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 />
            </button>

          </div>
        )}
      </div>

      {/* Personal Details */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Personal Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Full Name"
            value={profileData.name}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                name: e.target.value,
              })
            }
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                email: e.target.value,
              })
            }
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({
                ...profileData,
                phone: e.target.value,
              })
            }
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
          />

        </div>
      </div>

      {/* Skills */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Skills
        </h2>

        <textarea
          rows="4"
          placeholder="React, Node.js, Python, AWS, Docker"
          value={formatArrayForInput(profileData.skills)}
          onChange={(e) =>
            setProfileData({
              ...profileData,
              skills: parseCommaSeparated(e.target.value),
            })
          }
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        />
      </div>

{/* Work Experience */}
<div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

  <h2 className="text-xl font-semibold text-white mb-4">
    Work Experience
  </h2>

  {profileData.experience.map((exp, index) => (
    <div
      key={index}
      className="grid md:grid-cols-2 gap-4 mb-6 border border-slate-700 rounded-lg p-4"
    >

      <input
        type="text"
        placeholder="Designation"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={exp.designation || ""}
        onChange={(e) => {
          const updatedExperience = [...profileData.experience];
          updatedExperience[index].designation = e.target.value;

          setProfileData({
            ...profileData,
            experience: updatedExperience,
          });
        }}
      />

      <input
        type="text"
        placeholder="Company"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={exp.company || ""}
        onChange={(e) => {
          const updatedExperience = [...profileData.experience];
          updatedExperience[index].company = e.target.value;

          setProfileData({
            ...profileData,
            experience: updatedExperience,
          });
        }}
      />

      <input
        type="text"
        placeholder="Dates"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={exp.dates || ""}
        onChange={(e) => {
          const updatedExperience = [...profileData.experience];
          updatedExperience[index].dates = e.target.value;

          setProfileData({
            ...profileData,
            experience: updatedExperience,
          });
        }}
      />

      <textarea
        rows="4"
        placeholder="Description"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={formatDescriptionForInput(exp.description)}
        onChange={(e) => {
          const updatedExperience = [...profileData.experience];
          updatedExperience[index].description =
            parseDescriptionInput(e.target.value);

          setProfileData({
            ...profileData,
            experience: updatedExperience,
          });
        }}
      />

    </div>
  ))}

  <button
    type="button"
    onClick={() =>
      setProfileData({
        ...profileData,
        experience: [
          ...profileData.experience,
          {
            designation: "",
            company: "",
            dates: "",
            description: [],
          },
        ],
      })
    }
    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
  >
    + Add Experience
  </button>

</div>

{/* Projects */}
<div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

  <h2 className="text-xl font-semibold text-white mb-4">
    Projects
  </h2>

  {profileData.projects.map((project, index) => (
    <div
      key={index}
      className="mb-6 border border-slate-700 rounded-lg p-4"
    >

      <input
        type="text"
        placeholder="Title"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400 mb-4"
        value={project.title || ""}
        onChange={(e) => {
          const updatedProjects = [...profileData.projects];
          updatedProjects[index].title = e.target.value;

          setProfileData({
            ...profileData,
            projects: updatedProjects,
          });
        }}
      />

      <input
        type="text"
        placeholder="Technologies Used"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400 mb-4"
        value={formatArrayForInput(project.technologies)}
        onChange={(e) => {
          const updatedProjects = [...profileData.projects];
          updatedProjects[index].technologies =
            parseCommaSeparated(e.target.value);

          setProfileData({
            ...profileData,
            projects: updatedProjects,
          });
        }}
      />

      <textarea
        rows="4"
        placeholder="Project Description"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={project.description || ""}
        onChange={(e) => {
          const updatedProjects = [...profileData.projects];
          updatedProjects[index].description = e.target.value;

          setProfileData({
            ...profileData,
            projects: updatedProjects,
          });
        }}
      />

    </div>
  ))}

  <button
    type="button"
    onClick={() =>
      setProfileData({
        ...profileData,
        projects: [
          ...profileData.projects,
          {
            title: "",
            technologies: [],
            description: "",
          },
        ],
      })
    }
    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
  >
    + Add Project
  </button>

</div>

    {/* Education */}
<div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

  <h2 className="text-xl font-semibold text-white mb-4">
    Education
  </h2>

  {profileData.education.map((edu, index) => (
    <div
      key={index}
      className="grid md:grid-cols-3 gap-4 mb-6 border border-slate-700 rounded-lg p-4"
    >

      <input
        type="text"
        placeholder="Institution"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={edu.institution || ""}
        onChange={(e) => {
          const updatedEducation = [...profileData.education];
          updatedEducation[index].institution = e.target.value;

          setProfileData({
            ...profileData,
            education: updatedEducation,
          });
        }}
      />

      <input
        type="text"
        placeholder="Degree"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={edu.degree || ""}
        onChange={(e) => {
          const updatedEducation = [...profileData.education];
          updatedEducation[index].degree = e.target.value;

          setProfileData({
            ...profileData,
            education: updatedEducation,
          });
        }}
      />

      <input
        type="text"
        placeholder="Location"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={edu.location || ""}
        onChange={(e) => {
          const updatedEducation = [...profileData.education];
          updatedEducation[index].location = e.target.value;

          setProfileData({
            ...profileData,
            education: updatedEducation,
          });
        }}
      />

      <input
        type="text"
        placeholder="Graduation Year"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={edu.years || ""}
        onChange={(e) => {
          const updatedEducation = [...profileData.education];
          updatedEducation[index].years = e.target.value;

          setProfileData({
            ...profileData,
            education: updatedEducation,
          });
        }}
      />

      <input
        type="text"
        placeholder="GPA"
        className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400"
        value={edu.gpa || ""}
        onChange={(e) => {
          const updatedEducation = [...profileData.education];
          updatedEducation[index].gpa = e.target.value;

          setProfileData({
            ...profileData,
            education: updatedEducation,
          });
        }}
      />

    </div>
  ))}

  <button
    type="button"
    onClick={() =>
      setProfileData({
        ...profileData,
        education: [
          ...profileData.education,
          {
            institution: "",
            degree: "",
            years: "",
            location: "",
            gpa: "",
          },
        ],
      })
    }
    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
  >
    + Add Education
  </button>

</div>

      {/* Certifications */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h2 className="text-xl font-semibold text-white mb-4">
          Certifications
        </h2>

        <input
          type="text"
          placeholder="Professional Certifications"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-400 mb-4"
          value={formatArrayForInput(profileData.certifications)}
          onChange={(e) =>
            setProfileData({
              ...profileData,
              certifications: parseCommaSeparated(e.target.value),
            })
          }
        />
      </div>

      {/* Save Button */}
<div className="flex flex-col items-end gap-3">

  {/* ✅ Success message */}
  {saveSuccess && (
    <div className="w-full p-3 bg-emerald-900/50 border border-emerald-600 text-emerald-300 rounded-lg text-sm">
      {saveSuccess}
    </div>
  )}

  {/* ❌ Error message from backend */}
  {saveError && (
    <div className="w-full p-3 bg-red-900/50 border border-red-600 text-red-300 rounded-lg text-sm">
      {saveError}
    </div>
  )}

  <button
    onClick={handleSaveProfile}
    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium"
  >
    Save Profile
  </button>

</div>

    </div>
  )
};

export default MyProfile;