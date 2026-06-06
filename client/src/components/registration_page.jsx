import { useState } from "react";

function RegistrationPage({ onBackToLogin, onRegisterUser }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
    profilePhoto: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onRegisterUser({
      ...formData,
      profilePhoto: formData.profilePhoto?.name || "",
    });
  };

  return (
    <div className="login-container">
      <div className="login-card registration-card">
        <div className="profile-icon">R</div>

        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <label className="file-upload">
            <span>Upload Profile Photo</span>
            <input
              type="file"
              name="profilePhoto"
              accept="image/*"
              onChange={handleChange}
              required
            />
          </label>

          {formData.profilePhoto && (
            <p className="selected-file">{formData.profilePhoto.name}</p>
          )}

          <button type="submit" className="login-btn">
            REGISTER
          </button>

          <button
            type="button"
            className="register-text"
            onClick={onBackToLogin}
          >
            Already registered? Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationPage;
