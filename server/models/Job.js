const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: String,
    mandatorySkills: [String],
    preferredSkills: [String],
    experienceLevel: String,
    workType: String,
    salaryMin: Number,
    salaryMax: Number,
    deadline: Date,
    description: String,
    status: {
      type: String,
      default: "Open",
    },
    applicants: {
      type: Number,
      default: 0,
    },
    recruiterId: {
      type: String, // later we will use ObjectId
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
