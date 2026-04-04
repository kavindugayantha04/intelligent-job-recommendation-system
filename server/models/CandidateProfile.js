const mongoose = require("mongoose");

const candidateProfileSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  profilePicture: {
    type: String
  },

  resume: {
    type: String
  },

  preferredField: {
    type: String
  },

  desiredRole: {
    type: String
  },

  preferredLocation: {
    type: String
  },

  skills: [
    {
      type: String
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);