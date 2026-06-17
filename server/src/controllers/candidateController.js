    

const User = require("../models/User");
const Resume = require("../models/Resume");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const ai = require("../config/gemini");


const uploadResume = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file required"
            });
        }

        const filePath = req.file.path;
        const extension = path.extname(
            req.file.originalname
        ).toLowerCase();

        let extractedText = "";

        // DOCX
        if (extension === ".docx") {

            const result =
                await mammoth.extractRawText({
                    path: filePath
                });

            extractedText = result.value;
        }

        // PDF
        else if (extension === ".pdf") {

            const dataBuffer =
                fs.readFileSync(filePath);

            const parsedPdf =
                await pdf(dataBuffer);

            extractedText = parsedPdf.text;

            /*
             If pdf-parse couldn't
             extract meaningful text,
             use OCR.
            */

            if (
                !extractedText ||
                extractedText.trim().length < 50
            ) {

                console.log(
                    "Scanned PDF detected. Running OCR..."
                );

                const result =
                    await Tesseract.recognize(
                        filePath,
                        "eng"
                    );

                extractedText =
                    result.data.text;
            }
        }

        // JPG / PNG / JPEG
        else if (
            extension === ".jpg" ||
            extension === ".jpeg" ||
            extension === ".png"
        ) {

            const result =
                await Tesseract.recognize(
                    filePath,
                    "eng"
                );

            extractedText =
                result.data.text;
        }

        else {
            return res.status(400).json({
                success: false,
                message:
                    "Unsupported file format"
            });
        }

        // Store resume

        const resume =
            await Resume.create({

                candidate: req.user.id,

                resumeUrl: filePath,

                extractedText

            });

    // generating the response from the llm by providing the extracted content
        const prompt = `
You are a resume parser.

Extract information from the resume text and return ONLY valid JSON.

Schema:

{
  "name": "",
  "phone": "",
  "email":"",
  "skills": [],
  "education": [
            {
                "institution": "",
                "degree": "",
                "years": "",
                "location": "",
                "gpa": ""
            }
  ],
  "projects": [
            {
                "title": "",
                "technologies": [],
                "description": ""
            }
  ],
  "experience": [
            {
                "designation": "",
                "company":"",
                "dates": "",
                "description": []
            }
  ],
  "certifications":[],
}

Rules:
- Return only JSON.
- No markdown.
- No explanation.
- If a field is missing use empty string or empty array.

Resume Text:

${extractedText}
`;

const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
});

let profileData;

try {

    let jsonText =
        response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    profileData =
        JSON.parse(jsonText);

} catch (error) {

    console.error(
        "Failed to parse Gemini response:",
        response.text
    );

    return res.status(500).json({
        success:false,
        message:"Invalid AI response"
    });
}

        res.status(200).json({

            success: true,

            message:
                "Resume processed successfully",
            profileData

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const saveProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      skills,
      education,
      projects,
      experience,
      certifications,
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user.id }, // $ne = not equal — exclude current user
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use by another account." });
      }
    }

    // Check if phone is already taken by another user
    if (phone) {
  const last10 = phone.replace(/\D/g, "").slice(-10); // strip non-digits, take last 10

  const allUsers = await User.find({
    ph_no: { $exists: true, $ne: null },
    _id:   { $ne: req.user.id },
  }).select("ph_no");

  const phoneExists = allUsers.some((u) => {
    const existing = u.ph_no?.replace(/\D/g, "").slice(-10);
    return existing === last10;
  });

  if (phoneExists) {
    return res.status(400).json({ message: "Phone number is already in use by another account." });
  }
}

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        ph_no:    phone, // ← match your schema field name
        email,
        skills,
        education,
        projects,
        experience,
        certifications,
        profileCompleted: true,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile saved",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getProfile = async(req,res)=>{

    try{

        const user =
        await User.findById(req.user.id)
        .select("-password");

        res.status(200).json(user);

    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};


module.exports = {

    uploadResume,
    saveProfile,
    getProfile

}