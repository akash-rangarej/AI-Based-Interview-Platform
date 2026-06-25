const express = require("express");
const router = express.Router();

const {
  getCandidates,
  getRecruiters,
  addRecruiter,
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get(
  "/candidates",
  authMiddleware,
  roleMiddleware("admin"),
  getCandidates
);

router.get(
  "/recruiters",
  authMiddleware,
  roleMiddleware("admin"),
  getRecruiters
);

router.post("/add-recruiter",authMiddleware,roleMiddleware("admin"),addRecruiter)

module.exports = router;