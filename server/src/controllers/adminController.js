const User = require("../models/User");
const Admin = require("../models/Admin")

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
    const recruiters = await Admin.find({})
      .select("name email");

    res.status(200).json({ recruiters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const addRecruiter = async(req,res) =>{
  try{

    const {name , email} = req.body;

    const emailExist = await Admin.findOne({email})

    if(emailExist){
      return res.status(409).json({
        message:"the user with this email is already registered"
      })
    }

    const recruiter  = await Admin.create({
      name,
      email
    })

    return res.status(200).json({
      recruiter:recruiter,
      message:"the recruiter added successfully"
    })


  }
  catch(err){
    res.status(500).json({
      message:`server error: ${err}`
    })

  }
}

module.exports = {
  getCandidates,
  getRecruiters,
  addRecruiter
};