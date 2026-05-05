const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");
const auth = require("../middleware/authMiddleware");

// Supporting data
router.get("/getalljobs", auth, interviewController.getAllJobs);
router.get("/getall/candidates", auth, interviewController.getAllCandidates);

// Interview CRUD
router.post("/interview/create", auth, interviewController.createInterview);
router.get("/interview/all", auth, interviewController.getAllInterviews);

router.get(
  "/interview/my/scheduled-count",
  auth,
  interviewController.getMyScheduledInterviewCount
);

router.get("/interview/:id", auth, interviewController.getInterviewById);
router.put("/interview/:id", auth, interviewController.updateInterview);
router.delete("/interview/:id", auth, interviewController.deleteInterview);

module.exports = router;