import { useState } from "react";
import "./App.css";
import AnimatedBackground from "./components/Auth/AnimatedBackground";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Login from "./components/Auth/Login";
import RegistrationPage from "./components/Auth/registration_page";
import ResetPassword from "./components/Auth/ResetPassword";
import AdminDashboard from "./layouts/AdminLayout";
import CandidateLayout from "./layouts/CandidateLayout";
import MyProfile from "./components/dashboard/candidate/MyProfile";
import RecruiterLayout from "./layouts/RecruiterLayout";
import CandidateDashboard from "./components/dashboard/candidate/InterviewDashboard";
import InstructionPage from "./components/dashboard/candidate/Instruction";  // ← add
import api from "./api/axiosClient";

const STORAGE_KEY = "registeredUsers";
const AUTH_USER_KEY = "authUser";

const getInitialUsers = () => {
  const savedUsers = localStorage.getItem(STORAGE_KEY);
  if (!savedUsers) return [];
  try { return JSON.parse(savedUsers); } catch { return []; }
};

function App() {
  const [page, setPage] = useState("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState(getInitialUsers);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (!savedUser) return null;
    try { return JSON.parse(savedUser); } catch { return null; }
  });
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);  // ← add

  const saveUsers = (users) => {
    setRegisteredUsers(users);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  const handleRegisterUser = (user) => {
    const filteredUsers = registeredUsers.filter(
      (registeredUser) =>
        registeredUser.email.toLowerCase() !== user.email.toLowerCase()
    );
    saveUsers([...filteredUsers, user]);
    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    const role = user.role?.toLowerCase();
    if (role === "candidate")  setPage("candidate-portal");
    else if (role === "recruiter") setPage("recruiter-portal");
    else if (role === "admin") setPage("admin-portal");
  };

  const handlePasswordReset = (email, password) => {
    const updatedUsers = registeredUsers.map((user) =>
      user.email.toLowerCase() === email.toLowerCase()
        ? { ...user, password }
        : user
    );
    saveUsers(updatedUsers);
    setResetEmail("");
    setResetOtp("");
  };

  const handleOtpVerified = (email, otp) => {
    setResetEmail(email);
    setResetOtp(otp);
    setPage("reset-password");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    const role = user?.role?.toLowerCase();
    if (role === "candidate")      setPage("candidate-portal");
    else if (role === "recruiter") setPage("recruiter-portal");
    else if (role === "admin")     setPage("admin-portal");
    else                           setPage("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(AUTH_USER_KEY);
    setCurrentUser(null);
    setPage("login");
  };

 

  if (page === "recruiter-portal") {
    return (
      <RecruiterLayout
        user={currentUser}
        onLogout={handleLogout}
      >
        <div className="text-white text-2xl">Recruiter Dashboard</div>
      </RecruiterLayout>
    );
  }

  if (page === "admin-portal") {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminDashboard
        user={currentUser}
        onLogout={handleLogout}
      />
    </div>
  );
}

  if (page === "candidate-portal") {
    return (
      <CandidateLayout
        user={currentUser}
        onLogout={handleLogout}
      >
        {/* ── show instruction page or dashboard ── */}
        {selectedPost ? (
          <InstructionPage
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            onStart={() => {
              window.location.href = `/interview/${selectedPost._id}`;
            }}
          />
        ) : (
          <CandidateDashboard onAttend={(post) => setSelectedPost(post)} />
        )}
      </CandidateLayout>
    );
  }

  let pageContent = (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onForgotPasswordClick={(email) => {
        setForgotEmail(email);
        setPage("forgot-password");
      }}
      onRegisterClick={() => setPage("register")}
    />
  );

  if (page === "register") {
    pageContent = (
      <RegistrationPage
        onBackToLogin={() => setPage("login")}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  if (page === "forgot-password") {
    pageContent = (
      <ForgotPassword
        onBackToLogin={() => setPage("login")}
        onOtpVerified={handleOtpVerified}
        userEmail={forgotEmail}
      />
    );
  }

  if (page === "reset-password") {
    pageContent = (
      <ResetPassword
        email={resetEmail}
        otp={resetOtp}
        onBackToLogin={() => setPage("login")}
        onPasswordReset={handlePasswordReset}
      />
    );
  }

  return (
    <>
      <AnimatedBackground />
      {pageContent}
    </>
  );
}

export default App;