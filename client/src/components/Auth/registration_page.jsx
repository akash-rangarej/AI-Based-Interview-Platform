import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import api, { getErrorMessage } from "../../api/axiosClient";

function RegistrationPage({ onBackToLogin, onRegisterUser }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
    phone:"",
    profilePhoto: null,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

      const phoneNumber = (formData.phone || "").replace(/\D/g, "").slice(-10);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      ph_no: phoneNumber,
      profile_photo: formData.profilePhoto?.name || "",
    };

    try {
      const response = await api.post("/auth/register", payload);

      setMessage(response.data?.message || "Registration successful.");
      console.log("Registration response:", response.data);

      setTimeout(() => {
        onRegisterUser({
          ...formData,
          phone: phoneDigits,
          profilePhoto: response.data?.user?.profile_photo || "",
        });
      }, 800);
    } catch (error) {
      setMessage(
        getErrorMessage(error, "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
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
<PhoneInput
    international
    defaultCountry="IN"
    placeholder="Enter phone number"
    value={formData.phone}
    onChange={(value) =>
      setFormData((prev) => ({
        ...prev,
        phone: value,
      }))
    }
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

          {message && <p className="form-message">{message}</p>}

          <button type="submit" className="login-btn">
            {loading ? "REGISTERING..." : "REGISTER"}
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
