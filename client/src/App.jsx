import { useState } from "react";
import ForgotPassword from "./components/ForgotPassword";
import Login from "./components/Login";
import RegistrationPage from "./components/registration_page";
import "./App.css";

const STORAGE_KEY = "registeredUsers";

const getInitialUsers = () => {
  const savedUsers = localStorage.getItem(STORAGE_KEY);

  if (!savedUsers) {
    return [];
  }

  try {
    return JSON.parse(savedUsers);
  } catch {
    return [];
  }
};

function App() {
  const [page, setPage] = useState("login");
  const [registeredUsers, setRegisteredUsers] = useState(getInitialUsers);

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
    setPage("login");
  };

  const handlePasswordReset = (email, password) => {
    const updatedUsers = registeredUsers.map((user) =>
      user.email.toLowerCase() === email.toLowerCase()
        ? { ...user, password }
        : user
    );

    saveUsers(updatedUsers);
  };

  if (page === "register") {
    return (
      <RegistrationPage
        onBackToLogin={() => setPage("login")}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  if (page === "forgot-password") {
    return (
      <ForgotPassword
        registeredUsers={registeredUsers}
        onBackToLogin={() => setPage("login")}
        onPasswordReset={handlePasswordReset}
      />
    );
  }

  return (
    <Login
      onForgotPasswordClick={() => setPage("forgot-password")}
      onRegisterClick={() => setPage("register")}
    />
  );
}

export default App;
