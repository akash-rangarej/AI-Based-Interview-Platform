import { useState } from "react";

function Login({ onForgotPasswordClick, onRegisterClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      email,
      password,
    });
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
              onClick={onForgotPasswordClick}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-btn">
            LOGIN
          </button>

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
