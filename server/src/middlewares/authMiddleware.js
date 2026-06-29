// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {

//     try {

//         const authHeader =
//             req.headers.authorization;

//         if (
//             !authHeader ||
//             !authHeader.startsWith("Bearer")
//         ) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Token missing"
//             });
//         }

//         const token =
//             authHeader.split(" ")[1];

//         const decoded =
//             jwt.verify(
//                 token,
//                 process.env.JWT_SECRET
//             );

//         req.user = decoded;

//         next();

//     } catch (error) {

//         return res.status(401).json({
//             success: false,
//             message: "Invalid token"
//         });

//     }

// };

// module.exports = authMiddleware;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const authMiddleware = (req, res, next) => {
    try {
        const token =
            req.cookies?.jwt ||
            (
                req.headers.authorization?.startsWith("Bearer ")
                    ? req.headers.authorization.split(" ")[1]
                    : null
            );

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

module.exports = authMiddleware;