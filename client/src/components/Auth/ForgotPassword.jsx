import { useState } from "react";
import api, { getErrorMessage } from "../../api/axiosClient";

function ForgotPassword({ onBackToLogin, onOtpVerified, userEmail, userPhone }) {
  const [step, setStep] = useState("otp-options"); // skip email step
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState(""); // "email" or "phone"
  

  const handleSendOtp = async (method) => {
    setLoading(true);
    setMessage("");
    setOtpMethod(method);

    try {
      await api.post("/auth/forgot-password", {
        email: userEmail,
        method // send "email" or "phone" to backend
      });
      setMessage(`OTP sent to your registered ${method}.`);
      setStep("otp");
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    console.log("Email:", email);
    console.log("OTP:", otp);

    try {
      const response = await api.post("/auth/verify-otp", {
        email: userEmail,
        otp: otp.toString()
      });
      setMessage(response.data?.message || "OTP verified.");
      onOtpVerified(userEmail, otp);
    } catch (error) {
      setMessage(getErrorMessage(error, "Invalid OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card forgot-card">
        <div className="profile-icon profile-photo-icon">FP</div>
        <h2>Forgot Password</h2>

        {step === "otp-options" && (
          <div className="otp-options">
            <p>How would you like to receive the OTP?</p>

            {message && <p className="form-message">{message}</p>}

            <button
              className="login-btn"
              onClick={() => handleSendOtp("email")}
              disabled={loading}
            >
              {loading && otpMethod === "email" ? "SENDING..." : "SEND OTP TO EMAIL"}
            </button>

            <button
              className="login-btn"
              onClick={() => handleSendOtp("phone")}
              disabled={loading}
            >
              {loading && otpMethod === "phone" ? "SENDING..." : "SEND OTP TO MOBILE"}
            </button>
          </div>
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

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "VERIFYING..." : "VERIFY OTP"}
            </button>

            <button
              type="button"
              className="register-text"
              onClick={() => setStep("otp-options")}
            >
              Try another method
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