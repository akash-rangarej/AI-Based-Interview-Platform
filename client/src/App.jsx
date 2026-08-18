import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import AnimatedBackground from "./components/Auth/AnimatedBackground";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Login from "./components/Auth/Login";
import RegistrationPage from "./components/Auth/registration_page";
import ResetPassword from "./components/Auth/ResetPassword";
import { useAuthContext } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import InterviewRoute from "./pages/InterviewRoute";
import SetPassword from "./components/dashboard/recruiter/SetPassword";

const AuthShell = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-[#080d16]">
    <AnimatedBackground />
    {children}
  </div>
);

const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-[#080d16]" />
);

const PublicOnly = ({ children }) => {
  const { authUser, authLoading } = useAuthContext();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!authUser) {
    return children;
  }

  if (
    authUser.role === "recruiter" &&
    !authUser.passwordChanged
  ) {
    return <Navigate to="/set-password" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const PrivateOnly = ({ children }) => {
  const { authUser, authLoading } = useAuthContext();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  return authUser ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const navigate = useNavigate();
  const { authUser, authLoading } = useAuthContext();
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  const handleOtpVerified = (email, otp) => {
    setResetEmail(email);
    setResetOtp(otp);
    navigate("/reset-password");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          authLoading ? (
            <AuthLoadingScreen />
          ) :
            authUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
        }
      />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <AuthShell>
              <Login
                onForgotPasswordClick={(email) => {
                  setForgotEmail(email);
                  navigate("/forgot-password");
                }}
              />
            </AuthShell>
          </PublicOnly>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicOnly>
            <AuthShell>
              <RegistrationPage />
            </AuthShell>
          </PublicOnly>
        }
      />


      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <AuthShell>
              <ForgotPassword
                userEmail={forgotEmail}
                onOtpVerified={handleOtpVerified}
                onBackToLogin={()=> navigate("/login")}
              />
            </AuthShell>
          </PublicOnly>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicOnly>
            <AuthShell>
              <ResetPassword
                email={resetEmail}
                otp={resetOtp}
                onBackToLogin={() => navigate("/login")}
              />
            </AuthShell>
          </PublicOnly>
        }
      />

      <Route
        path="/set-password"
        element={
          <PrivateOnly>
            <AuthShell>
            <SetPassword onPasswordChanged={()=> navigate("/dashboard")} />
            </AuthShell>
          </PrivateOnly>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateOnly>
            <Dashboard />
          </PrivateOnly>

        }
      />

      <Route
        path="/interview/:interviewId"
        element={
          <PrivateOnly>
            <InterviewRoute />
          </PrivateOnly>
        }
      />

      <Route
        path="*"
        element={
          authLoading ? (
            <AuthLoadingScreen />
          ) : (
            <Navigate to={authUser ? "/dashboard" : "/login"} replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;