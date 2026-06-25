const express = require("express");
const router = express.Router();

const {
  getCandidates,
  getRecruiters,
  deleteCandidate,
  deleteRecruiter,
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

router.delete(
  "/candidates/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCandidate
);

router.delete(
  "/recruiters/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteRecruiter
);

module.exports = router;