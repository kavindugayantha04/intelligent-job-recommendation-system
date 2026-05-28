const fs = require("fs");
const path = require("path");
const CompanyProfile = require("../models/CompanyProfile");

const COMPANY_WEB = path.join(__dirname, "..", "uploads", "company");

function resolveCompanyPath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return null;
  const resolved = path.resolve(__dirname, "..", relativePath);
  if (!resolved.startsWith(path.resolve(COMPANY_WEB))) return null;
  return resolved;
}

function safeUnlink(relativePath) {
  const full = resolveCompanyPath(relativePath);
  if (full && fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch (e) {
      console.error("Company profile image delete error:", e.message);
    }
  }
}

const DEFAULTS = {
  companyName: "Our Company",
  tagline: "Building the future of work",
  about: "",
  mission: "",
  vision: "",
  culture: "",
  benefits: [],
  location: "",
  email: "",
  phone: "",
  website: "",
  logo: "",
  bannerImage: "",
  galleryImages: [],
};

async function getOrCreateProfile() {
  let doc = await CompanyProfile.findOne();
  if (!doc) {
    doc = await CompanyProfile.create({ ...DEFAULTS });
  }
  return doc;
}

function relUrlFromFile(file) {
  if (!file) return null;
  return path.join("uploads", "company", file.filename).replace(/\\/g, "/");
}

function parseBenefits(raw) {
  if (raw === undefined || raw === null) return null;
  if (Array.isArray(raw)) {
    return raw.map((b) => String(b).trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed.map((b) => String(b).trim()).filter(Boolean);
    }
  } catch {
    /* fall through */
  }
  return s
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

exports.getCompanyProfile = async (req, res) => {
  try {
    const profile = await getOrCreateProfile();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load company profile.",
    });
  }
};

exports.updateCompanyProfile = async (req, res) => {
  try {
    const profile = await getOrCreateProfile();

    const {
      companyName,
      tagline,
      about,
      mission,
      vision,
      culture,
      location,
      email,
      phone,
      website,
      benefits,
    } = req.body;

    if (companyName !== undefined) profile.companyName = String(companyName).trim();
    if (tagline !== undefined) profile.tagline = String(tagline).trim();
    if (about !== undefined) profile.about = String(about).trim();
    if (mission !== undefined) profile.mission = String(mission).trim();
    if (vision !== undefined) profile.vision = String(vision).trim();
    if (culture !== undefined) profile.culture = String(culture).trim();
    if (location !== undefined) profile.location = String(location).trim();
    if (email !== undefined) profile.email = String(email).trim();
    if (phone !== undefined) profile.phone = String(phone).trim();
    if (website !== undefined) profile.website = String(website).trim();

    const parsedBenefits = parseBenefits(benefits);
    if (parsedBenefits !== null) profile.benefits = parsedBenefits;

    const files = req.files || {};
    if (files.logo && files.logo[0]) {
      if (profile.logo) safeUnlink(profile.logo);
      profile.logo = relUrlFromFile(files.logo[0]);
    }
    if (files.bannerImage && files.bannerImage[0]) {
      if (profile.bannerImage) safeUnlink(profile.bannerImage);
      profile.bannerImage = relUrlFromFile(files.bannerImage[0]);
    }

    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update company profile.",
    });
  }
};

exports.uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No gallery image uploaded.",
      });
    }

    const profile = await getOrCreateProfile();
    const rel = relUrlFromFile(req.file);
    profile.galleryImages = [...(profile.galleryImages || []), rel];
    await profile.save();

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload gallery image.",
    });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    const imageName = req.params.imageName;
    if (!imageName) {
      return res.status(400).json({
        success: false,
        message: "Image name is required.",
      });
    }

    const decoded = decodeURIComponent(imageName);
    const profile = await getOrCreateProfile();

    const match = (profile.galleryImages || []).find((p) => {
      const base = path.basename(p || "");
      return base === decoded || p === decoded || p.endsWith(decoded);
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    profile.galleryImages = (profile.galleryImages || []).filter((p) => p !== match);
    await profile.save();
    safeUnlink(match);

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete gallery image.",
    });
  }
};
