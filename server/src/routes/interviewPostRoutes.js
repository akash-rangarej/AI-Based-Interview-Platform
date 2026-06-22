const express = require("express");
const router  = express.Router();

const {
  createInterviewPost,
  Can_getDashboardPosts,
  Rec_getDashboardPosts,
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
router.get("/dashboard", authMiddleware, roleMiddleware("candidate"), Can_getDashboardPosts);

// Recruiter — see all available interviews on dashboard
router.get("/my-posts", authMiddleware, roleMiddleware("recruiter"), Rec_getDashboardPosts);

// Candidate — get full details of one interview before attending
router.get("/:postId", authMiddleware, roleMiddleware("candidate"), getInterviewPostById);

// Candidate — mark interview as completed
router.patch("/:postId/complete", authMiddleware, roleMiddleware("candidate"), completeInterviewPost);

// Recruiter - delete the post they made 
router.delete("/:postId", authMiddleware, roleMiddleware("recruiter"), deleteInterviewPost);

module.exports = router;