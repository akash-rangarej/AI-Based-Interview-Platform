const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createMailTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendPasswordResetOtp = async (user, otp) => {
    if (process.env.EMAIL_DEBUG_OTP === "true") {
       
        return;
    }

    const transporter = createMailTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: "Password reset OTP",
        text: "Your password reset OTP is ${otp}. It will expire in 10 minutes."
    });
};

const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const getProfilePhotoDataUri = (user) => {
    if (!user.profile_photo?.data || !user.profile_photo?.contentType) {
        return "";
    }

    const base64Image = Buffer.from(user.profile_photo.data).toString("base64");

    return `data:${user.profile_photo.contentType};base64,${base64Image}`;
};

const formatUserResponse = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ph_no: user.ph_no,
        profile_photo: getProfilePhotoDataUri(user)
    };
};


// registration
const registerUser = async (req, res) => {
    try {

        const { name, email, ph_no, password, role } = req.body;

        if (!name || !email || !ph_no || !password || !role) {
            return res.status(400).json({
                message: "Name, email, phone number, password and role are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { ph_no: ph_no.trim() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email or phone number"
            });
        }


        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            ph_no: ph_no.trim(),
            password: hashedPassword,
            role: role.trim(),
            profile_photo: req.file
                ? {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                }
                : undefined
        });

        res.status(201).json({
            message: "User registered successfully",
            token: createToken(user),
            user: formatUserResponse(user)
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "User does not exist"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            message: "User logged in successfully",
            token: createToken(user),
            user: formatUserResponse(user)
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email, method } = req.body; // method = "email" or "phone"

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        if (method === "phone") {
            // Integrate SMS service here (Twilio, AWS SNS, etc.)
            // For now just log it
            console.log(`OTP for ${user.ph_no}: ${otp}`);
            // await sendSmsOtp(user.ph_no, otp);
        } else {
            // default to email
            try {
                await sendPasswordResetOtp(user, otp);
            } catch (mailError) {
                if (mailError.code === "EAUTH" || mailError.responseCode === 535) {
                    return res.status(500).json({
                        message: "Gmail rejected the email login. Use a Gmail App Password."
                    });
                }
                throw mailError;
            }
        }

        res.status(200).json({
            message: `OTP sent to your registered ${method || "email"}`,
            user: formatUserResponse(user)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();


        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({
                message: "Email, OTP and new password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();


        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;

        await user.save();

        res.status(200).json({
            message: "Password reset successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    verifyOtp,
    resetPassword
};