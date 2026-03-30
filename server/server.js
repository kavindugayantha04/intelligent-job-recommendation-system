// ============================
// Load Environment Variables
// ============================
require("dotenv").config();
console.log("Loaded JWT:", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// ============================
// Middleware
// ============================

// Enable CORS for React (Vite)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Parse JSON body
app.use(express.json());

// Serve uploaded files (profile pictures & resumes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ============================
// MongoDB Connection
// ============================

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  });


// ============================
// Routes
// ============================

const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/authRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

// Test route
app.get("/", (req, res) => {
  res.send("Backend + MongoDB is running");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate", candidateRoutes);


// ============================
// Global Error Handler
// ============================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    message: "Internal Server Error"
  });
});


// ============================
// Start Server
// ============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});