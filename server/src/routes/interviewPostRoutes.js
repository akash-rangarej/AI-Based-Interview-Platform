const express = require("express");
const router  = express.Router();

const {
  createInterviewPost,
  getDashboardPosts,
  getInterviewPostById,
  cancelInterviewPost,
  completeInterviewPost,
  deleteInterviewPost
} = require("../controllers/interviewPostController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Recruiter — post a new interview
router.post("/post", authMiddleware, roleMiddleware("recruiter"), createInterviewPost);

// Candidate — see all available interviews on dashboard
router.get("/dashboard", authMiddleware, roleMiddleware("candidate"), getDashboardPosts);

// Recruiter — see all available interviews on dashboard
router.get("/my-posts", authMiddleware, roleMiddleware("recruiter"), getDashboardPosts);

// Candidate — get full details of one interview before attending
router.get("/:postId", authMiddleware, roleMiddleware("candidate"), getInterviewPostById);

// Candidate — mark interview as completed
router.patch("/:postId/complete", authMiddleware, roleMiddleware("candidate"), completeInterviewPost);

// Recruiter - delete the post they made 
router.delete("/:postId", authMiddleware, roleMiddleware("recruiter"), deleteInterviewPost);

module.exports = router;