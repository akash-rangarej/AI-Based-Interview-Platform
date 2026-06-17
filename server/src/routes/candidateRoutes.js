
const express = require("express");

const router = express.Router();

const upload =
require("../middlewares/uploadMiddleware");

const candidateController =
require("../controllers/candidateController");

const authMiddleware =
require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");


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

// router.put(
//     "/update-profile",
//     authMiddleware,
//     candidateController.saveProfile
// )

module.exports = router;