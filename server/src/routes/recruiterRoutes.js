const express = require("express");
const router = express.Router();
const {getCandidates}  = require("../controllers/recruiterController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/candidates", authMiddleware, roleMiddleware("recruiter"), getCandidates);

// router.get("/candidate/:id",authMiddleware, roleMiddleware("recruiter"), getCandidateProfile);

module.exports = router;