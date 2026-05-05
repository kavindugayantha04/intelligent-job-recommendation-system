require("dotenv").config();
console.log("Loaded JWT:", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  });

const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/authRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const userRoutes = require("./routes/users");
const applicationRoutes = require("./routes/applicationRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const logRoutes = require("./routes/logRoutes");
const recruiterProfileRoutes = require("./routes/recruiterProfileRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const courseRoutes = require("./routes/courseRoutes");
const questionRoutes = require("./routes/questionRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const chatRoutes = require("./routes/chatRoutes");
const faqRoutes = require("./routes/faqRoutes");
const chatlogRoutes = require("./routes/chatlogRoutes");
const companyProfileRoutes = require("./routes/companyProfileRoutes");

app.get("/", (req, res) => {
  res.send("Backend + MongoDB is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", recruiterRoutes);
app.use("/api", interviewRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", recruiterProfileRoutes);
app.use("/api/recommendations", recommendationRoutes);

/* === Course / MCQ / Skill-gap (rule-based) === */
app.use("/api/courses", courseRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/skill-gap", skillGapRoutes);

/* === Help/Chatbot === */
app.use("/api/chat", chatRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/logs", chatlogRoutes);
app.use("/api/company-profile", companyProfileRoutes);

/* =========================================================
   Global error handler.
   Turns multer errors (size limit, rejected file type, etc.)
   and any thrown error into a clean JSON response so the
   frontend never has to parse HTML stack traces.
========================================================= */
app.use((err, req, res, next) => {
  console.error("Server Error:", err && err.stack ? err.stack : err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error.",
      debug: { step: "multer", code: err.code },
    });
  }

  // Errors thrown from fileFilter come through as plain Error instances.
  if (
    err &&
    typeof err.message === "string" &&
    /Only PDF|Only JPG|company images|Invalid file field/.test(err.message)
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
      debug: { step: "multer-filter" },
    });
  }

  res.status(500).json({
    success: false,
    message: (err && err.message) || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
