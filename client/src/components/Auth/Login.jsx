import { useState } from "react";
import api, { getErrorMessage } from "../../api/axiosClient";
import { useAuthContext } from "../../context/AuthContext";

function Login({ onForgotPasswordClick, onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // if (response.data?.token) {
      //   localStorage.setItem("token", response.data.token);
      // }

  
      setMessage(response.data?.message || "Login successful.");
      console.log("Login response:", response.data);
      onLoginSuccess(response.data?.user);
    } catch (error) {
      setMessage(getErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="profile-icon">
          👤
        </div>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="options">
            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <button
              type="button"
              className="link-button"

              onClick={() => {
  if (!email) {
    setMessage("Please enter your email first.");
    return;
  }
  onForgotPasswordClick(email);
}}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-btn">
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>

          {message && <p className="form-message">{message}</p>}

          <button
            type="button"
            className="register-text"
            onClick={onRegisterClick}
          >
            or Get Registered
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;
