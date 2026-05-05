const express = require("express");
const router = express.Router();
console.log("application routes loaded");
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/authMiddleware");

router.use(auth);

// Candidate applies to a job
router.post("/", applicationController.applyToJob);

// Candidate views own applications
router.get("/my", applicationController.getMyApplications);

// Recruiter views all applicants for a selected job
router.get("/job/:jobId", applicationController.getApplicationsByJob);

// Candidate withdraws an application
router.delete("/:id", applicationController.withdrawApplication);

module.exports = router;