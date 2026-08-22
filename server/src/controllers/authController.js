const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateTokenAndSetCookie } = require("../utils/generateToken");
const Admin = require("../models/Admin")
const otpStore = new Map();

const createMailTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendOtp = async (email, otp) => {
    if (process.env.EMAIL_DEBUG_OTP === "true") {
        return;
    }

    const transporter = createMailTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Password reset OTP",
        text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`
    });
};


const formatUserResponse = (user) => {
    const response = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordChanged: user.passwordChanged
    };

    if (user.role === "recruiter") {
        response.passwordChanged = user.passwordChanged === true;
    }

    return response;
};

const getMe = async (req, res) => {
    try {
        const { id, role } = req.user;


        if (role === "admin" && id === "admin") {
            return res.status(200).json({
                user: {
                    id: "admin",
                    name: "Administrator",
                    email: process.env.ADMIN_EMAIL,
                    role: "admin"
                }
            });
        }

        const user =
            role === "recruiter"
                ? await Admin.findById(id)
                : await User.findById(id);


        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json({
            user: formatUserResponse(user)
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch user details. Please try again later."
        });
    }
};

const emailVerify = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }
        const emailregex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

        if (!emailregex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            })
        }

        const existingUser = await Admin.findOne({ email: email.toLowerCase().trim() });
        const existingCandidate = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser || existingCandidate) {
            return res.status(409).json({
                message: "A user with this email is already registered."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otp = crypto.randomInt(100000, 1000000).toString();

        otpStore.set(normalizedEmail, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        try {
            await sendOtp(normalizedEmail, otp);
        } catch (mailErr) {
            otpStore.delete(normalizedEmail);
            console.log("mail error yowaimo: ", mailErr)
            return res.status(502).json({
                message: "Unable to send OTP email. Please try again later."
            });
        }

        res.status(200).json({
            message: "OTP sent to your registered email."
        });


    } catch (error) {
        res.status(500).json({ message: "Unable to process request. Please try again later." });
    }
};

const otpVerify = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!otp || !email) {
            return res.status(400).json({ message: "OTP and email are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const storedData = otpStore.get(normalizedEmail);

        if (!storedData) {
            return res.status(400).json({ message: "No OTP request found for this email." });
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        if (storedData.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        otpStore.delete(normalizedEmail);
        res.status(200).json({ message: "OTP verified successfully." });


    } catch (error) {
        res.status(500).json({ message: "Unable to verify OTP. Please try again later." });
    }
}
// registration
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const admin = process.env.ADMIN_EMAIL == normalizedEmail ? true : false
        const recruiter = await Admin.findOne({ email: normalizedEmail })

        const candidate = await User.findOne({
            email: normalizedEmail
        })

        const existingUser = admin || recruiter || candidate;

        if (existingUser) {
            return res.status(409).json({
                message: "A user already exists with this email."
            });
        }



        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "candidate",
        });

        generateTokenAndSetCookie(user, res);

        res.status(201).json({
            message: "User registered successfully.",
            user: formatUserResponse(user),
            mustChangePassword: true
        });

    } catch (error) {
        res.status(500).json({
            message: `Unable to register user. Please try again later.: ${error}`
        });
    }
};



// login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {

            generateTokenAndSetCookie({
                id: "admin",
                role: "admin"
            }, res);
            return res.status(200).json({
                message: "Admin logged in successfully.",
                user: {
                    id: "admin",
                    name: "Administrator",
                    email: process.env.ADMIN_EMAIL,
                    role: "admin"
                }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const recruiter = await Admin.findOne({ email: normalizedEmail })

        if (recruiter) {

            const isRecPass = await bcrypt.compare(password, recruiter.password);
            if (!isRecPass) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }


            generateTokenAndSetCookie(recruiter, res);
            return res.status(200).json({
                message: "Recruiter logged in successfully.",
                user: formatUserResponse(recruiter)
            });

        }

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }
        generateTokenAndSetCookie(user, res);
        res.status(200).json({
            message: "User logged in successfully.",
            user: formatUserResponse(user)
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to log in. Please try again later."
        });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const recruiter = await Admin.findOne({ email: normalizedEmail })

        const user = await User.findOne({ email: normalizedEmail });

        const cur_user = recruiter || user

        if (!cur_user) {
            // Avoid confirming whether an email is registered
            return res.status(200).json({
                message: "If an account exists for this email, an OTP has been sent."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        cur_user.resetPasswordOtp = otp;
        cur_user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
        await cur_user.save();

        try {
            await sendOtp(cur_user.email, otp);
        } catch (mailErr) {
            return res.status(502).json({
                message: "Unable to send OTP email. Please try again later."
            });
        }

        res.status(200).json({
            message: "If an account exists for this email, an OTP has been sent."
        });

    } catch (error) {
        res.status(500).json({ message: "Unable to process request. Please try again later." });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const recruiter = await Admin.findOne({
            email: normalizedEmail,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        })

        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        });

        const cur_user = recruiter || user;

        if (!cur_user) {
            return res.status(400).json({
                message: "Invalid or expired OTP."
            });
        }

        cur_user.resetPasswordOtp = undefined;
        cur_user.canResetPassword = true;

        await cur_user.save();

        res.status(200).json({
            message: "OTP verified successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to verify OTP. Please try again later."
        });
    }
};



const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and new password are required."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();


        const recruiter = await Admin.findOne({
            email: normalizedEmail,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        });
        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOtpExpire: {
                $gt: Date.now()
            }
        });

        const cur_user = recruiter || user

        if (!cur_user) {
            return res.status(400).json({
                message: "Invalid or expired OTP."
            });
        }

        if (!cur_user.canResetPassword) {
            return res.status(400).json({
                message: "Invalid or expired OTP."
            });
        }

        cur_user.password = await bcrypt.hash(password, 10);
        cur_user.canResetPassword = undefined;
        cur_user.resetPasswordOtpExpire = undefined;

        await cur_user.save();

        res.status(200).json({
            message: "Password reset successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to reset password. Please try again later."
        });
    }
};

const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0
        });

        res.status(200).json({
            message: "Logged out successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to log out. Please try again later."
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    getMe,
    createMailTransporter,
    emailVerify,
    otpVerify,
};