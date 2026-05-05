const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection (local)
mongoose.connect(process.env.MONGO_URI) // no extra options needed
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:");
    console.error(err.message);
    process.exit(1);
  });

// Test Route
// app.get("/", (req, res) => res.send("Server is running!"));

// Start Server
const PORT = process.env.PORT || 5000;
console.log("Mongo URI:", process.env.MONGO_URI);


//all routes
const interviewRoutes = require('./Routes/AllRoutes');
app.use('/', interviewRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


