const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateProfile",
      required: true
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Upcoming", "Completed", "Cancelled"],
      default: "Upcoming"
    },

    venue: {
      type: String,
      default: "Online"
    },

    resultStatus: {
      type: String,
      enum: ["Pending", "Pass", "Fail"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);