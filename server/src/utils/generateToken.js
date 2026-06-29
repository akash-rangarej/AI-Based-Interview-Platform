const jwt = require("jsonwebtoken");


const generateTokenAndSetCookie = (user, res) => {
    console.log('Setting JWT cookie')
  try {
    const token = jwt.sign({
        id: user._id || user.id,
        role: user.role,
      }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    res.cookie("jwt", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    return token;
    
  } catch(error){
    throw new Error("Failed to generate authentication token");
  }
};

module.exports={generateTokenAndSetCookie} ;
