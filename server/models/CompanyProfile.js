const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "Our Company" },
    tagline: { type: String, default: "Building the future of work" },
    about: { type: String, default: "" },
    mission: { type: String, default: "" },
    vision: { type: String, default: "" },
    culture: { type: String, default: "" },
    benefits: { type: [String], default: [] },
    location: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    galleryImages: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
