const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getRecruiterProfile,
  updateRecruiterProfile,
  changeRecruiterPassword
} = require("../controllers/recruiterProfileController");

router.get("/recruiter/profile", auth, getRecruiterProfile);
router.put("/recruiter/profile", auth, updateRecruiterProfile);
router.put("/recruiter/change-password", auth, changeRecruiterPassword);

module.exports = router;