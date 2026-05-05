const mongoose = require("mongoose");

const candidateCVSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    size: { type: Number, default: 0 },
    extractedText: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

candidateCVSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CandidateCV", candidateCVSchema);
