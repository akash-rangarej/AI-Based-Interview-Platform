import { useState } from "react";

function ForgotPassword({ registeredUsers, onBackToLogin, onPasswordReset }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleEmailSubmit = (e) => {
    e.preventDefault();

    const registeredUser = registeredUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!registeredUser) {
      setMessage("This email is not registered.");
      return;
    }

    const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(nextOtp);
    setMessage("OTP sent to your registered email.");
    console.log(`Forgot password OTP for ${email}: ${nextOtp}`);
    setStep("otp");
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();

    if (otp !== generatedOtp) {
      setMessage("Invalid OTP. Please try again.");
      return;
    }

    setMessage("");
    setStep("password");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    onPasswordReset(email, newPassword);
    setMessage("Password updated. Redirecting to login...");

    setTimeout(() => {
      onBackToLogin();
    }, 1200);
  };

  return (
    <div className="login-container">
      <div className="login-card forgot-card">
        <div className="profile-icon">FP</div>

        <h2>Forgot Password</h2>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Registered Email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && <p className="form-message">{message}</p>}

            <button type="submit" className="login-btn">
              SEND OTP
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit}>
            <div className="input-group">
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            {message && <p className="form-message">{message}</p>}

            <button type="submit" className="login-btn">
              VERIFY OTP
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {message && <p className="form-message">{message}</p>}

            <button type="submit" className="login-btn">
              UPDATE PASSWORD
            </button>
          </form>
        )}

        <button type="button" className="register-text" onClick={onBackToLogin}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
