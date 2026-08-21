import axios from "axios";

const api = axios.create({
  baseURL: "https://ai-based-interview-platform-hc6e.onrender.com/api",
  withCredentials: true,
});

export const getErrorMessage = (error, fallbackMessage) => {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    fallbackMessage
  );
};

export default api;
