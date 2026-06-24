const User = require("../models/User");

const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: "candidate" })
      .select("name email ph_no");

    res.status(200).json({ candidates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({ role: "recruiter" })
      .select("name email ph_no");

    res.status(200).json({ recruiters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCandidates,
  getRecruiters,
};