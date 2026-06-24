const express = require("express");
const router = express.Router();

const {
  getCandidates,
  getRecruiters,
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

module.exports = router;