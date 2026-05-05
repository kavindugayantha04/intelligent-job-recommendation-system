const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/authMiddleware");

// CREATE JOB
router.post("/", auth, jobController.createJob);

// GET ALL JOBS
router.get("/", jobController.getAllJobs);

// RECRUITER VIEWS RANKED APPLICANTS FOR A JOB
router.get("/:jobId/applicants", auth, applicationController.getRankedApplicantsByJob);

// CLOSE JOB
router.patch("/:id/close", auth, jobController.closeJob);

// UPDATE JOB
router.put("/:id", auth, jobController.updateJob);

// DELETE JOB
router.delete("/:id", auth, jobController.deleteJob);

module.exports = router;