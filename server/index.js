require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes")
const app = express();
const recuiterRoutes = require("./src/routes/recruiterRoutes")
const candidateRoutes = require('./src/routes/candidateRoutes')
const interviewPostRoutes = require("./src/routes/interviewPostRoutes")
const userRoutes = require("./src/routes/recruiterRoutes")
const interviewRoutes = require("./src/routes/interviewRoutes")
const adminRoutes = require("./src/routes/adminRoutes");
const cookieParser = require("cookie-parser");
connectDB();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/recruiter",recuiterRoutes)
app.use("/api/interview-posts", interviewPostRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interview",interviewRoutes)
app.use("/api/admin", adminRoutes);

app.listen(5000, () => {
    console.log(`Server running on port 5000`);
});
