const express = require("express");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const CandidateCV = require("../models/CandidateCV");
const auth = require("../middleware/authMiddleware");
const uploadCV = require("../middleware/uploadMiddleware");

const extractResumeText = require("../utils/extractResumeText");
const { ExtractionError } = require("../utils/extractResumeText");
const { looksLikeCV } = require("../utils/cvValidator");

const router = express.Router();

/* =========================================================
   AUTH — all user routes require a logged-in candidate.
========================================================= */
router.use(auth);

router.use(async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "candidate") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can access this feature.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

/* =========================================================
   HELPERS
========================================================= */

/** Silently delete a file. Ignores missing files. */
function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn("[users] failed to unlink", filePath, e.message);
  }
}

/** Log everything useful about the uploaded file so we can debug any failure. */
function logUpload(context, req) {
  const f = req.file || {};
  console.log(`[users] ${context} ::`, {
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    destination: f.destination,
    filename: f.filename,
    path: f.path,
    absPath: f.path ? path.resolve(f.path) : null,
    userId: req.userId,
  });
}

async function setPrimaryCv(userId, cvId) {
  await CandidateCV.updateMany({ userId }, { $set: { isPrimary: false } });
  await CandidateCV.updateOne({ _id: cvId, userId }, { $set: { isPrimary: true } });
}

/**
 * Map an ExtractionError.code (or any thrown error) to a clean
 * HTTP 400 response with a specific, truthful message.
 * Returns the HTTP status code used (500 for MODULE_MISSING).
 */
function sendExtractionError(res, err, debug) {
  const code = err instanceof ExtractionError ? err.code : "UNKNOWN";
  const baseDebug = { step: "extract", code, ...debug };

  // Missing npm package is a server-side misconfiguration → 500.
  if (code === "MODULE_MISSING" || code === "MODULE_LOAD_FAILED") {
    console.error("[users] EXTRACTION MODULE ERROR:", err.message, err.extra);
    return res.status(500).json({
      success: false,
      message: err.message,
      debug: { ...baseDebug, extra: err.extra },
    });
  }

  let message;
  switch (code) {
    case "UNSUPPORTED_FORMAT":
      message = err.message || "Only PDF/DOC/DOCX files are allowed.";
      break;
    case "READ_FAILED":
      message = "The uploaded file could not be read from disk. Please try again.";
      break;
    case "PARSE_FAILED":
      message =
        "The uploaded PDF/DOCX could not be parsed. The file may be corrupted, password-protected, or image-only.";
      break;
    case "EMPTY_TEXT":
      message = "Text could not be extracted from this file.";
      break;
    default:
      message = err.message || "Failed to process the uploaded file.";
  }

  console.error("[users] EXTRACTION ERROR:", code, err.message, err.extra || "");
  return res.status(400).json({
    success: false,
    message,
    debug: { ...baseDebug, originalError: err.message, extra: err.extra },
  });
}

/**
 * Extract + validate the uploaded file. If anything fails, the
 * response is sent directly and this returns `null` so the caller
 * stops further processing. On success returns the extracted text.
 */
async function extractAndValidateCv(req, res) {
  // Use the real saved path from multer — don't reconstruct it.
  const filePath = path.resolve(req.file.path);

  let extracted;
  try {
    extracted = await extractResumeText(filePath);
  } catch (e) {
    safeUnlink(filePath);
    sendExtractionError(res, e, {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      filePath,
    });
    return null;
  }

  console.log(
    `[users] extracted ${extracted.text.length} chars from ${req.file.filename} (${extracted.ext})`
  );

  const check = looksLikeCV(extracted.text);

  if (!check.isCV) {
    safeUnlink(filePath);
    console.log(
      `[users] CV REJECTED — cvScore=${check.cvScore} nonCvScore=${check.nonCvScore} length=${check.length} reason="${check.reason}"`
    );
    res.status(400).json({
      success: false,
      message:
        check.reason ||
        "The uploaded file does not appear to be a valid CV/resume.",
      debug: {
        step: "cv-validation",
        code: "NOT_A_CV",
        cvScore: check.cvScore,
        nonCvScore: check.nonCvScore,
        textLength: check.length,
      },
    });
    return null;
  }

  return extracted.text;
}

/* =========================================================
   GET /users/preferences — current preferences + resume
========================================================= */
router.get("/preferences", async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.userId });

    if (!profile) {
      return res.json({
        success: true,
        data: {
          preferences: { field: "", role: "", location: "", skills: [] },
          resume: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        preferences: {
          field: profile.preferredField || "",
          role: profile.desiredRole || "",
          location: profile.preferredLocation || "",
          skills: profile.skills || [],
        },
        resume: profile.resume || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch preferences.",
    });
  }
});

/* =========================================================
   GET /users/cvs — list all uploaded CVs for user
========================================================= */
router.get("/cvs", async (req, res) => {
  try {
    const cvs = await CandidateCV.find({ userId: req.userId })
      .sort({ isPrimary: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: cvs.map((cv) => ({
        id: cv._id,
        originalName: cv.originalName,
        fileName: cv.fileName,
        isPrimary: cv.isPrimary,
        createdAt: cv.createdAt,
        textLength: (cv.extractedText || "").length,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch CV list.",
    });
  }
});

/* =========================================================
   POST /users/cvs — upload additional CV (multi-CV support)
========================================================= */
router.post("/cvs", uploadCV.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Expected multipart field name: 'cv'.",
      });
    }

    logUpload("POST /cvs", req);
    const resumeText = await extractAndValidateCv(req, res);
    if (resumeText === null) return;

    const profile = (await CandidateProfile.findOne({ userId: req.userId })) ||
      new CandidateProfile({ userId: req.userId });

    const cvDoc = await CandidateCV.create({
      userId: req.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname || req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size || 0,
      extractedText: resumeText,
      isPrimary: false,
    });

    await setPrimaryCv(req.userId, cvDoc._id);

    // Keep backward compatibility: profile keeps currently selected CV.
    profile.resume = req.file.filename;
    profile.resumeText = resumeText;
    await profile.save();

    return res.status(201).json({
      success: true,
      message: "CV uploaded and set as active.",
      data: {
        cvId: cvDoc._id,
        originalName: cvDoc.originalName,
        resumeTextLength: resumeText.length,
      },
    });
  } catch (error) {
    console.error("[users] POST /cvs error:", error);
    if (req.file) safeUnlink(path.resolve(req.file.path));
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload CV.",
    });
  }
});

/* =========================================================
   PUT /users/cvs/:cvId/select — set active CV for chat/reco
========================================================= */
router.put("/cvs/:cvId/select", async (req, res) => {
  try {
    const cv = await CandidateCV.findOne({ _id: req.params.cvId, userId: req.userId });
    if (!cv) {
      return res.status(404).json({ success: false, message: "CV not found." });
    }

    await setPrimaryCv(req.userId, cv._id);

    const profile = (await CandidateProfile.findOne({ userId: req.userId })) ||
      new CandidateProfile({ userId: req.userId });
    profile.resume = cv.fileName;
    profile.resumeText = cv.extractedText;
    await profile.save();

    return res.json({
      success: true,
      message: "Active CV updated.",
      data: { cvId: cv._id, originalName: cv.originalName },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   POST /users/cv — upload or replace CV
========================================================= */
router.post("/cv", uploadCV.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Expected multipart field name: 'cv'.",
        debug: { step: "multer", code: "NO_FILE" },
      });
    }

    logUpload("POST /cv", req);

    const resumeText = await extractAndValidateCv(req, res);
    if (resumeText === null) return; // response already sent

    let profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    // Replace any existing CV file on disk.
    if (profile.resume) {
      const oldPath = path.resolve(
        path.dirname(req.file.path),
        path.basename(profile.resume)
      );
      safeUnlink(oldPath);
    }

    profile.resume = req.file.filename;
    profile.resumeText = resumeText;
    await profile.save();

    const cvDoc = await CandidateCV.create({
      userId: req.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname || req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size || 0,
      extractedText: resumeText,
      isPrimary: false,
    });
    await setPrimaryCv(req.userId, cvDoc._id);

    console.log(
      `[users] CV saved for user ${req.userId} — resumeTextLength=${resumeText.length}`
    );

    res.json({
      success: true,
      message: "CV uploaded successfully.",
      data: {
        cvPath: profile.resume,
        cvId: cvDoc._id,
        resumeTextLength: resumeText.length,
      },
    });
  } catch (error) {
    console.error("[users] POST /cv fatal error:", error);
    if (req.file) safeUnlink(path.resolve(req.file.path));
    res.status(500).json({
      success: false,
      message: error.message || "CV upload failed.",
      debug: { step: "handler", code: "UNCAUGHT" },
    });
  }
});

/* =========================================================
   PUT /users/cv — replace an existing CV
========================================================= */
router.put("/cv", uploadCV.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Expected multipart field name: 'cv'.",
        debug: { step: "multer", code: "NO_FILE" },
      });
    }

    logUpload("PUT /cv", req);

    const profile = await CandidateProfile.findOne({ userId: req.userId });

    if (!profile || !profile.resume) {
      safeUnlink(path.resolve(req.file.path));
      return res.status(400).json({
        success: false,
        message: "No existing CV found. Please upload a CV first.",
        debug: { step: "precondition", code: "NO_EXISTING_CV" },
      });
    }

    const resumeText = await extractAndValidateCv(req, res);
    if (resumeText === null) return;

    const oldPath = path.resolve(
      path.dirname(req.file.path),
      path.basename(profile.resume)
    );
    safeUnlink(oldPath);

    profile.resume = req.file.filename;
    profile.resumeText = resumeText;
    await profile.save();

    const cvDoc = await CandidateCV.create({
      userId: req.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname || req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size || 0,
      extractedText: resumeText,
      isPrimary: false,
    });
    await setPrimaryCv(req.userId, cvDoc._id);

    res.json({
      success: true,
      message: "CV updated successfully.",
      data: {
        cvPath: profile.resume,
        cvId: cvDoc._id,
        resumeTextLength: resumeText.length,
      },
    });
  } catch (error) {
    console.error("[users] PUT /cv fatal error:", error);
    if (req.file) safeUnlink(path.resolve(req.file.path));
    res.status(500).json({
      success: false,
      message: error.message || "CV update failed.",
      debug: { step: "handler", code: "UNCAUGHT" },
    });
  }
});

/* =========================================================
   DELETE /users/cv
   ---------------------------------------------------------
   Removes the uploaded CV file AND clears every CV-derived
   field on the candidate profile so that downstream
   features (skill-gap, recommendations) cannot keep using
   stale CV-extracted data.

   Cleared fields:
     - profile.resume       -> ""
     - profile.resumeText   -> ""
     - profile.extractedSkills  (if it ever gets added)
     - profile.cvSkills          (if it ever gets added)
     - profile.resumeSkills      (if it ever gets added)

   We intentionally do NOT touch profile.skills — that's
   user-curated data, owned by the candidate.

   Response includes the cleared CV state so the client
   can sync its local cache immediately.
========================================================= */
router.delete("/cv", async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.userId });

    if (!profile || !profile.resume) {
      return res.status(400).json({
        success: false,
        message: "No CV found to delete.",
      });
    }

    // Best-effort delete of the file on disk.
    const resumesDir = process.env.UPLOAD_PATH || "./uploads/resumes";
    safeUnlink(path.resolve(resumesDir, path.basename(profile.resume)));

    // Clear all CV-derived fields. Use schema defaults ("") instead of
    // null so String(profile.resumeText || '').trim() always works.
    profile.resume = "";
    profile.resumeText = "";

    // Defensive: unset any legacy CV-extracted skill arrays so they
    // can never linger and silently feed the skill-gap engine.
    for (const k of ["extractedSkills", "cvSkills", "resumeSkills"]) {
      if (profile[k] !== undefined) {
        profile[k] = [];
        if (typeof profile.markModified === "function") {
          profile.markModified(k);
        }
      }
    }

    await profile.save();

    console.log(
      `[users] CV deleted for user ${req.userId} — resume="" resumeText=""`
    );

    res.json({
      success: true,
      message: "CV deleted successfully.",
      data: {
        resume: "",
        resumeText: "",
      },
    });
  } catch (error) {
    console.error("[users] DELETE /cv error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "CV deletion failed.",
    });
  }
});

/* =========================================================
   PUT /users/preferences — update user preferences
========================================================= */
router.put("/preferences", async (req, res) => {
  try {
    const { field, role, location, skills } = req.body;

    let profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    const cleanField = field !== undefined ? String(field).trim() : undefined;
    const cleanRole = role !== undefined ? String(role).trim() : undefined;
    const cleanLocation = location !== undefined ? String(location).trim() : undefined;

    if (cleanField !== undefined) {
      if (!cleanField) {
        return res.status(400).json({ success: false, message: "Preferred field is required." });
      }
      profile.preferredField = cleanField;
    }

    if (cleanRole !== undefined) {
      if (!cleanRole) {
        return res.status(400).json({ success: false, message: "Desired role is required." });
      }
      profile.desiredRole = cleanRole;
    }

    if (cleanLocation !== undefined) {
      if (!cleanLocation) {
        return res.status(400).json({ success: false, message: "Preferred location is required." });
      }
      profile.preferredLocation = cleanLocation;
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ success: false, message: "Skills must be an array." });
      }
      profile.skills = skills.map((item) => String(item).trim()).filter(Boolean);
    }

    await profile.save();

    res.json({
      success: true,
      message: "Preferences updated successfully.",
      data: {
        preferences: {
          field: profile.preferredField || "",
          role: profile.desiredRole || "",
          location: profile.preferredLocation || "",
          skills: profile.skills || [],
        },
        resume: profile.resume || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update preferences.",
    });
  }
});

module.exports = router;
