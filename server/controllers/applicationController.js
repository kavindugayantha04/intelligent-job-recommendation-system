const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");

function normalizeText(v) {
  return String(v || "").toLowerCase().trim();
}

/**
 * Parse approximate years from a single experience row's `duration` field.
 * Handles: "3 years", "Jan 2020 - Present", "2020–2024", "2+ years".
 */
function parseYearsFromDuration(duration) {
  const s = String(duration || "").trim();
  if (!s) return 0;
  const lower = s.toLowerCase();

  const yearMatch = /\b(19|20)\d{2}\b/g;
  const yearsFound = s.match(yearMatch);
  if (yearsFound && yearsFound.length >= 2) {
    const y1 = parseInt(yearsFound[0], 10);
    const y2 = parseInt(yearsFound[yearsFound.length - 1], 10);
    return Math.max(0, Math.min(y2 - y1, 35));
  }
  if (yearsFound && yearsFound.length === 1) {
    const y1 = parseInt(yearsFound[0], 10);
    if (/present|current|now|till date|to date/.test(lower)) {
      const cy = new Date().getFullYear();
      return Math.max(0, Math.min(cy - y1 + 1, 35));
    }
  }

  const explicitYears = lower.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/);
  if (explicitYears) return Math.min(Number(explicitYears[1]) || 0, 35);

  const nums = lower.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;

  if (lower.includes("-") && nums.length >= 2) {
    return Math.min((Number(nums[0]) + Number(nums[1])) / 2, 35);
  }

  return Math.min(Number(nums[0]) || 0, 35);
}

function parseYearsFromText(text) {
  return parseYearsFromDuration(text);
}

function getRequiredYears(job) {
  return parseYearsFromText(job?.experienceLevel || "");
}

function getApplicantYears(profile) {
  const items = Array.isArray(profile?.experience) ? profile.experience : [];
  if (!items.length) return 0;
  let total = 0;
  for (const exp of items) {
    total += parseYearsFromDuration(exp?.duration || "");
  }
  return Math.min(total, 40);
}

const SKILL_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "have", "your", "you",
  "are", "our", "will", "seeking", "looking", "experience", "years", "year",
  "team", "work", "skills", "skill", "must", "nice", "preferred", "job",
]);

/**
 * When the job has no `mandatorySkills`, infer tokens from title/description/category
 * so skill match is not stuck at 0/0.
 */
function inferSkillsFromJobText(job) {
  const blob = [job?.title, job?.category, job?.description, job?.experienceLevel]
    .map((x) => String(x || ""))
    .join(" ")
    .toLowerCase();

  const fromPreferred = Array.isArray(job?.preferredSkills)
    ? job.preferredSkills.map((s) => normalizeText(s)).filter(Boolean)
    : [];

  const tokens = new Set(fromPreferred);
  const raw = blob.replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/);
  for (const t of raw) {
    if (t.length < 2 || SKILL_STOPWORDS.has(t)) continue;
    tokens.add(t);
  }

  const list = [...tokens];
  const trimmed = list.slice(0, 25);
  if (!trimmed.length) {
    const fallback = normalizeText(job?.title || job?.category || "");
    return fallback ? [fallback] : [];
  }
  return trimmed;
}

function buildApplicantSkillHaystack(profile) {
  const skillList = Array.isArray(profile?.skills)
    ? profile.skills.map((s) => normalizeText(s)).filter(Boolean)
    : [];
  const resume = normalizeText(profile?.resumeText || "");
  /** Treat role/category/experience prose as searchable like resume for overlap with job tokens */
  const extraBits = [];
  if (profile) {
    extraBits.push(
      normalizeText(profile.desiredRole || ""),
      normalizeText(profile.preferredField || ""),
      normalizeText(profile.bio || "")
    );
    for (const exp of Array.isArray(profile.experience) ? profile.experience : []) {
      extraBits.push(normalizeText(exp?.title || ""), normalizeText(exp?.description || ""));
    }
    for (const ed of Array.isArray(profile.education) ? profile.education : []) {
      extraBits.push(normalizeText(ed?.fieldOfStudy || ""), normalizeText(ed?.degree || ""));
    }
  }
  const resumeBlob = [resume, extraBits.filter(Boolean).join(" ")].filter(Boolean).join(" ");
  return { skillSet: new Set(skillList), resumeBlob };
}

function skillMatchesRequired(reqSkill, { skillSet, resumeBlob }) {
  if (!reqSkill) return false;
  for (const appSkill of skillSet) {
    if (appSkill === reqSkill || appSkill.includes(reqSkill) || reqSkill.includes(appSkill)) {
      return true;
    }
  }
  if (resumeBlob && resumeBlob.includes(reqSkill)) return true;
  const compact = reqSkill.replace(/[\s+#.]/g, "");
  if (compact.length >= 3 && resumeBlob && resumeBlob.replace(/[\s+#.]/g, "").includes(compact)) {
    return true;
  }
  return false;
}

/**
 * Token overlap between job title/category and the candidate narrative (role, field, CV text).
 * Used for ranking when totalScore ties (often at 0% when sparse profile data exists).
 */
function tokenSetFromJobRoleText(job) {
  const blob = normalizeText(`${job?.title || ""} ${job?.category || ""}`);
  const tokens = new Set();
  blob
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .forEach((t) => {
      if (t.length >= 3 && !SKILL_STOPWORDS.has(t)) tokens.add(t);
    });
  return tokens;
}

function computeCategoryAffinity(job, profile) {
  const jobTokens = tokenSetFromJobRoleText(job);
  if (!jobTokens.size) return 0;

  const parts = [];
  if (profile) {
    parts.push(
      normalizeText(profile.preferredField || ""),
      normalizeText(profile.desiredRole || ""),
      normalizeText(profile.bio || ""),
      normalizeText(String(profile.resumeText || "").substring(0, 12000))
    );
    for (const e of Array.isArray(profile.experience) ? profile.experience : []) {
      parts.push(normalizeText(e?.title || ""), normalizeText(e?.description || ""));
    }
    for (const ed of Array.isArray(profile.education) ? profile.education : []) {
      parts.push(
        normalizeText(ed?.fieldOfStudy || ""),
        normalizeText(ed?.degree || ""),
        normalizeText(ed?.university || "")
      );
    }
    for (const s of Array.isArray(profile.skills) ? profile.skills : []) {
      parts.push(normalizeText(s || ""));
    }
  }
  const candBlob = parts.join(" ");

  let hits = 0;
  for (const t of jobTokens) {
    if (t && candBlob.includes(t)) hits += 1;
  }
  return Math.round((hits / jobTokens.size) * 100);
}

function compareRankedApplicants(a, b) {
  const tieTotal = Number(b.totalScore) - Number(a.totalScore);
  if (tieTotal !== 0) return tieTotal;

  const tieCat = Number(b.categoryAffinity || 0) - Number(a.categoryAffinity || 0);
  if (tieCat !== 0) return tieCat;

  const ma = a.matchDetails?.matchedSkills?.length || 0;
  const mb = b.matchDetails?.matchedSkills?.length || 0;
  if (mb !== ma) return mb - ma;

  const ya = Number(a.matchDetails?.applicantYears || 0);
  const yb = Number(b.matchDetails?.applicantYears || 0);
  if (yb !== ya) return yb - ya;

  const sa = a.profile?.skills?.length || 0;
  const sb = b.profile?.skills?.length || 0;
  if (sb !== sa) return sb - sa;

  const na = String(a.user?.name || "").toLowerCase();
  const nb = String(b.user?.name || "").toLowerCase();
  return na.localeCompare(nb);
}

function computeEducationScore(job, profile) {
  const education = Array.isArray(profile?.education) ? profile.education : [];
  if (!education.length) return 0;

  const jobText = [
    job?.title,
    job?.category,
    job?.description,
    job?.experienceLevel,
  ]
    .map(normalizeText)
    .join(" ");

  const degreeText = education
    .map((e) => `${e?.degree || ""} ${e?.fieldOfStudy || ""}`)
    .join(" ")
    .toLowerCase();

  if (!degreeText.trim()) return 0;

  const degreeHints = [
    "bachelor",
    "master",
    "phd",
    "bsc",
    "msc",
    "engineering",
    "computer",
    "information technology",
    "data science",
    "statistics",
  ];

  const overlap = degreeHints.some(
    (k) => jobText.includes(k) && degreeText.includes(k)
  );

  return overlap ? 10 : 0;
}

function computeApplicantScore(job, profile) {
  const requiredSkillsRaw =
    (Array.isArray(job?.requiredSkills) && job.requiredSkills) ||
    (Array.isArray(job?.mandatorySkills) && job.mandatorySkills) ||
    [];

  let requiredSkills = requiredSkillsRaw
    .map((s) => normalizeText(s))
    .filter(Boolean);

  if (!requiredSkills.length) {
    requiredSkills = inferSkillsFromJobText(job);
  }

  const haystack = buildApplicantSkillHaystack(profile);

  const matchedSkills =
    requiredSkills.length > 0
      ? requiredSkills.filter((reqSkill) => skillMatchesRequired(reqSkill, haystack))
      : [];

  const skillScore =
    requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 60
      : 0;

  const requiredYears = getRequiredYears(job);
  const applicantYears = getApplicantYears(profile);
  const experienceScore =
    requiredYears > 0
      ? Math.min((applicantYears / requiredYears) * 30, 30)
      : Math.min(applicantYears * 5, 30); // light fallback if job has no explicit years

  const educationScore = computeEducationScore(job, profile);
  const totalScore = Math.min(skillScore + experienceScore + educationScore, 100);

  return {
    totalScore: Number(totalScore.toFixed(2)),
    skillScore: Number(skillScore.toFixed(2)),
    experienceScore: Number(experienceScore.toFixed(2)),
    educationScore: Number(educationScore.toFixed(2)),
    matchedSkills,
    requiredSkills,
    applicantYears: Number(applicantYears.toFixed(2)),
    requiredYears: Number(requiredYears.toFixed(2)),
  };
}

/* =========================
   APPLY TO JOB
========================= */
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required.",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    if (job.status === "Closed") {
      return res.status(400).json({
        message: "This job is closed.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (job.deadline) {
      const deadline = new Date(job.deadline);
      deadline.setHours(0, 0, 0, 0);

      if (deadline < today) {
        return res.status(400).json({
          message: "This job is expired.",
        });
      }
    }

    const existingApplication = await Application.findOne({
      userId: req.userId,
      jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job.",
      });
    }

    const application = new Application({
      userId: req.userId,
      jobId,
      coverLetter: coverLetter || "",
    });

    await application.save();

    job.applicants = (job.applicants || 0) + 1;
    await job.save();

    res.status(201).json({
      message: "Application submitted successfully.",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to apply for job.",
    });
  }
};

/* =========================
   GET MY APPLICATIONS
========================= */
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .populate("jobId")
      .sort({ createdAt: -1 });

    res.json({
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch applications.",
    });
  }
};

/* =========================
   GET APPLICATIONS BY JOB
   (Recruiter side)
========================= */
async function buildRankedApplicationsResponse(jobId) {
  const job = await Job.findById(jobId);
  if (!job) {
    const err = new Error("Job not found.");
    err.status = 404;
    throw err;
  }

  const applications = await Application.find({ jobId })
    .populate("userId", "name email role")
    .sort({ createdAt: -1 });

  const enrichedApplications = await Promise.all(
    applications.map(async (application) => {
      const profile = await CandidateProfile.findOne({
        userId: application.userId?._id,
      });

      const score = computeApplicantScore(job, profile);
      const categoryAffinity = computeCategoryAffinity(job, profile);

      return {
        _id: application._id,
        coverLetter: application.coverLetter,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        candidateProfileId: profile ? profile._id : null,
        totalScore: score.totalScore,
        categoryAffinity,
        scoreBreakdown: {
          skillScore: score.skillScore,
          experienceScore: score.experienceScore,
          educationScore: score.educationScore,
        },
        matchDetails: {
          matchedSkills: score.matchedSkills,
          requiredSkills: score.requiredSkills,
          applicantYears: score.applicantYears,
          requiredYears: score.requiredYears,
          categoryAffinity,
        },
        user: application.userId
          ? {
              _id: application.userId._id,
              name: application.userId.name,
              email: application.userId.email,
              role: application.userId.role,
            }
          : null,
        profile: profile
          ? {
              _id: profile._id,
              profilePicture: profile.profilePicture || "",
              phone: profile.phone || "",
              location: profile.location || "",
              bio: profile.bio || "",
              linkedin: profile.linkedin || "",
              github: profile.github || "",
              portfolio: profile.portfolio || "",
              preferredField: profile.preferredField || "",
              desiredRole: profile.desiredRole || "",
              preferredLocation: profile.preferredLocation || "",
              skills: profile.skills || [],
              education: profile.education || [],
              experience: profile.experience || [],
              courses: profile.courses || [],
            }
          : null,
      };
    })
  );

  enrichedApplications.sort(compareRankedApplicants);

  return {
    job: {
      _id: job._id,
      title: job.title,
      category: job.category,
      status: job.status,
      applicants: job.applicants || 0,
      deadline: job.deadline,
      requiredSkills: job.requiredSkills || job.mandatorySkills || [],
      experienceLevel: job.experienceLevel || "",
    },
    applications: enrichedApplications,
  };
}

exports.getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required.",
      });
    }

    const payload = await buildRankedApplicationsResponse(jobId);
    res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Failed to fetch applications for this job.",
    });
  }
};

exports.getRankedApplicantsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required." });
    }
    const payload = await buildRankedApplicationsResponse(jobId);
    return res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || "Failed to fetch ranked applicants.",
    });
  }
};

/* =========================
   WITHDRAW APPLICATION
========================= */
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    const job = await Job.findById(application.jobId);
    if (job && job.applicants > 0) {
      job.applicants -= 1;
      await job.save();
    }

    await Application.findByIdAndDelete(req.params.id);

    res.json({
      message: "Application withdrawn successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to withdraw application.",
    });
  }
};