const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getRecommendationsForMe,
} = require("../controllers/recommendationController");

/* =====================================
   GET RECOMMENDED JOBS FOR CURRENT USER
   POST /api/recommendations/me
===================================== */
router.post("/me", authMiddleware, getRecommendationsForMe);

module.exports = router;
