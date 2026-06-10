
const express = require("express");

const router = express.Router();

const upload =
require("../middlewares/uploadMiddleware");

const candidateController =
require("../controllers/candidateController");

const authMiddleware =
require("../middlewares/authMiddleware");


router.post(

    "/upload-resume",

    authMiddleware,

    upload.single("resume"),
    candidateController.uploadResume

);

router.post(

    "/profile",

    authMiddleware,

    candidateController.saveProfile

);

router.get(

    "/profile",

    authMiddleware,

    candidateController.getProfile

);


// router.post(
//   "/multer-test",
//   upload.single("resume"),
//   (req, res) => {
//     console.log("FILE:", req.file);

//     res.json({
//       file: req.file
//     });
//   }
// );

module.exports = router;