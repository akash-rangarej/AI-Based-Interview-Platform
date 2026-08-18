require("dotenv").config();
require("./upload-pipeline/workers/upload.worker");
require("./upload-pipeline/workers/finalize.worker");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes")
const recuiterRoutes = require("./src/routes/recruiterRoutes")
const candidateRoutes = require('./src/routes/candidateRoutes')
const interviewPostRoutes = require("./src/routes/interviewPostRoutes")
const userRoutes = require("./src/routes/recruiterRoutes")
const interviewRoutes = require("./src/routes/interviewRoutes")
const adminRoutes = require("./src/routes/adminroutes");
const cookieParser = require("cookie-parser");
const initializeInterviewSocket = require("./src/utils/socket");
const initializeConnectionGuard = require("./src/utils/connectionGuard"); 
const { autoSubmitInterview } = require("./src/controllers/interviewController");

const app = express();
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    },
    pingInterval: 2000,  
    pingTimeout: 2000, 
});

initializeInterviewSocket(io);


initializeConnectionGuard(io, {
    onGraceExpired: async (interviewId) => {
        await autoSubmitInterview(interviewId, "connection-timeout");
        initializeInterviewSocket.endSession(interviewId);
    },
})


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
app.use("/api/interview",interviewRoutes);
app.use("/api/admin", adminRoutes);

server.listen(5000, () => {
    console.log(`Server running on port 5000`);
});
