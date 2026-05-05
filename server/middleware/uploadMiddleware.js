const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
   Resolve / ensure upload directories.
   Using absolute paths avoids subtle CWD bugs if the server is
   started from a different directory.
========================================================= */
const RESUMES_DIR = path.resolve("uploads/resumes");
const PROFILES_DIR = path.resolve("uploads/profiles");

[RESUMES_DIR, PROFILES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cv") {
      cb(null, RESUMES_DIR);
    } else if (file.fieldname === "profilePicture") {
      cb(null, PROFILES_DIR);
    } else {
      cb(new Error(`Invalid file field name: ${file.fieldname}`), null);
    }
  },

  filename: (req, file, cb) => {
    // Keep the original name but prefix a timestamp so collisions are
    // impossible. Strip any whitespace so paths stay simple.
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

/* =========================================================
   File filter — only checks type/extension.
   IMPORTANT: we never run content validation (looksLikeCV) here.
   That runs AFTER multer has saved the file so the post-save
   handler can read the bytes.
========================================================= */
const CV_ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const CV_ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Some browsers / tools send these generic types for PDFs.
  "application/octet-stream",
];

const IMG_ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const IMG_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  if (file.fieldname === "cv") {
    // Accept if EITHER the extension OR the mimetype matches.
    if (CV_ALLOWED_EXT.includes(ext) || CV_ALLOWED_MIME.includes(mime)) {
      return cb(null, true);
    }
    return cb(
      new Error("Only PDF/DOC/DOCX files are allowed."),
      false
    );
  }

  if (file.fieldname === "profilePicture") {
    if (IMG_ALLOWED_EXT.includes(ext) || IMG_ALLOWED_MIME.includes(mime)) {
      return cb(null, true);
    }
    return cb(
      new Error("Only JPG, JPEG, PNG, and WEBP files are allowed for profile pictures."),
      false
    );
  }

  return cb(new Error(`Invalid file field name: ${file.fieldname}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;
