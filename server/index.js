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
connectDB();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/interviews", interviewPostRoutes);
app.use("/api/users", userRoutes);

app.listen(5000, () => {
    console.log(`Server running on port 5000`);
});
