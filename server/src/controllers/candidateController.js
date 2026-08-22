const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const cloudinary = require("../config/cloudinary")
const OpenAI = require("openai")
const AIUsage = require("../models/AIUsage");
const Admin = require("../models/Admin")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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


        // generating the response from the llm by providing the extracted content
        const prompt = `
You are a resume parser.

Extract information from the resume text and return ONLY valid JSON.

Schema:

{
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



        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
        });

        let raw = response.choices[0].message.content;

        await AIUsage.findOneAndUpdate(
            {},
            {
                $inc: {
                    totalRequests: 1,
                    resumeTokens: response.usage.total_tokens,
                    totalTokens: response.usage.total_tokens,
                },
            }
        );

        let profileData;

        try {

            let jsonText =
                raw
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();

            profileData =
                JSON.parse(jsonText);

            personal_info = await User.findById(req.user.id).select("name email")
            profileData.name = personal_info.name
            profileData.email = personal_info.email
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: "Invalid AI response"
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
            email,
            skills,
            education,
            projects,
            experience,
            certifications,
        } = req.body;

        // Check if email is already taken by another user
        if (email) {
            const recruiter = await Admin.findOne({ email })
            const user = await User.findOne({
                email,
                _id: { $ne: req.user.id }, // $ne = not equal — exclude current user
            });
            const emailExists = recruiter || user;

            if (emailExists) {
                return res.status(400).json({ message: "Email is already in use by another account." });
            }
        }


        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                email,
                skills,
                education,
                projects,
                experience,
                certificates: certifications,
                profileCompleted: true,
            },
            { returnDocument: "after" }
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


const getProfile = async (req, res) => {

    try {
        const user =
            await User.findById(req.user.id)
                .select("-password");
        res.status(200).json({
            success: true,
            profile: user,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};


module.exports = {

    uploadResume,
    saveProfile,
    getProfile

}