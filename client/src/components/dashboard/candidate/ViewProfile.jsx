import { useEffect, useState } from "react";
import api from "../../../api/axiosClient";

const ViewProfile = ({onEdit}) => {

  const [profile, setProfile] = useState(null);

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const token =
          localStorage.getItem("token");

        const response =
          await api.get(
            "/candidate/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

        setProfile(
          response.data.profile
        );

      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();

  }, []);

  if (!profile) {
    return (
      <div className="text-white">
        Loading...
      </div>
    );
  }

  return (

    <div className="space-y-6">

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h1 className="text-3xl font-bold text-white mb-6">
          My profile
        </h1>

        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <p className="text-slate-400">
              Name
            </p>

            <p className="text-white">
              {profile.name}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Email
            </p>

            <p className="text-white">
              {profile.email}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Phone
            </p>

            <p className="text-white">
              {profile.phone}
            </p>
          </div>

        </div>

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h2 className="text-xl font-semibold text-white mb-4">
          Skills
        </h2>

        <div className="flex flex-wrap gap-2">

          {profile.skills?.map((skill,index)=>(
            <span
              key={index}
              className="px-3 py-1 bg-indigo-600 rounded-full text-white text-sm"
            >
              {skill}
            </span>
          ))}

        </div>

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h2 className="text-xl font-semibold text-white mb-4">
          Education
        </h2>

        {profile.education?.map((edu,index)=>(
          <p
            key={index}
            className="text-slate-300 mb-2"
          >
            {edu}
          </p>
        ))}

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h2 className="text-xl font-semibold text-white mb-4">
          Experience
        </h2>

        {profile.experience?.map((exp,index)=>(
          <p
            key={index}
            className="text-slate-300 mb-2"
          >
            {exp}
          </p>
        ))}

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">

        <h2 className="text-xl font-semibold text-white mb-4">
          Projects
        </h2>

        {profile.projects?.map((project,index)=>(
          <p
            key={index}
            className="text-slate-300 mb-2"
          >
            {project}
          </p>
        ))}

      </div>
      <button
  onClick={onEdit}
  className="px-4 py-2 bg-indigo-600 rounded-lg text-white"
>
  Update Profile
</button>

    </div>
  );
};

export default ViewProfile;