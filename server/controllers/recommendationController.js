const axios = require("axios");

const CandidateProfile = require("../models/CandidateProfile");
const Job = require("../models/Job");

/* =========================================================
   CONFIG
========================================================= */
const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000/recommend";
const STRICT_AI_THRESHOLD = Number(process.env.AI_STRICT_THRESHOLD || 0.15);
const RELAXED_AI_THRESHOLD = Number(process.env.AI_RELAXED_THRESHOLD || 0.05);

// The CV text is the PRIMARY signal. It must be at least this long
// (after trimming) to be considered usable. Anything shorter is almost
// certainly not a real CV and could produce garbage recommendations.
const MIN_RESUME_TEXT_LENGTH = 100;

const NO_CV_MESSAGE =
  "Upload your CV to get recommendations.";
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "will",
  "your", "you", "are", "was", "were", "has", "had", "not", "but", "can",
  "our", "job", "jobs", "work", "experience", "role", "skills", "skill",
]);

/* =========================================================
   HELPERS
========================================================= */

function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractKeywords(text, max = 80) {
  const cleaned = safeTrim(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  if (!cleaned) return [];

  const unique = new Set();
  for (const token of cleaned.split(/\s+/)) {
    if (!token || token.length < 3 || STOPWORDS.has(token)) continue;
    unique.add(token);
    if (unique.size >= max) break;
  }
  return [...unique];
}

function buildJobSearchText(job) {
  if (!job) return "";
  const parts = [
    job.title,
    job.category,
    Array.isArray(job.mandatorySkills) ? job.mandatorySkills.join(" ") : "",
    Array.isArray(job.preferredSkills) ? job.preferredSkills.join(" ") : "",
    job.description,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function prefilterJobsByCvKeywords(candidateText, jobs) {
  const keywords = extractKeywords(candidateText);
  if (!keywords.length) return jobs;

  const filtered = jobs.filter((job) => {
    const haystack = buildJobSearchText(job);
    if (!haystack) return false;
    let overlap = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        overlap += 1;
        if (overlap >= 2) return true;
      }
    }
    return false;
  });

  // If prefilter is too strict for a particular CV, gracefully keep originals.
  return filtered.length > 0 ? filtered : jobs;
}

function rankJobsByKeywordOverlap(candidateText, jobs, topN = 10) {
  const keywords = extractKeywords(candidateText, 120);
  if (!keywords.length || !Array.isArray(jobs) || jobs.length === 0) return [];

  const ranked = jobs
    .map((job) => {
      const haystack = buildJobSearchText(job);
      if (!haystack) return null;

      let overlap = 0;
      for (const kw of keywords) {
        if (haystack.includes(kw)) overlap += 1;
      }

      if (overlap === 0) return null;

      // Use overlap ratio as fallback relevance score in [0,1].
      const score = Math.min(1, overlap / Math.max(8, keywords.length));
      return {
        ...job,
        similarity_score: Number(score.toFixed(4)),
        _overlap: overlap,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b._overlap !== a._overlap) return b._overlap - a._overlap;
      return (b.similarity_score || 0) - (a.similarity_score || 0);
    })
    .slice(0, topN)
    .map(({ _overlap, ...job }) => job);

  return ranked;
}

/**
 * Build the free-text candidate string sent to the AI microservice.
 *
 * RULES:
 *   - A non-empty `resumeText` is REQUIRED. Without it we return "" so
 *     the controller can skip the AI call entirely.
 *   - Preferences (preferredField, desiredRole, skills) are appended
 *     as a light boost ONLY on top of the CV text — never alone.
 *     To give the CV the dominant weight we include the resume text
 *     once and the preferences once; the CV is typically far longer,
 *     so it naturally drives ranking while preferences just nudge it.
 */
function buildCandidateText(profile) {
  if (!profile) return "";

  const resumeText = safeTrim(profile.resumeText);

  // Hard gate — no CV text means no recommendations.
  if (!resumeText || resumeText.length < MIN_RESUME_TEXT_LENGTH) {
    return "";
  }

  const preferredField = safeTrim(profile.preferredField);
  const desiredRole = safeTrim(profile.desiredRole);

  const skillsArray = Array.isArray(profile.skills) ? profile.skills : [];
  const skills = skillsArray.map((s) => safeTrim(s)).filter(Boolean).join(" ");

  // CV text dominates; preferences are a small boost appended once.
  const boost = [preferredField, desiredRole, skills].filter(Boolean).join(" ");
  return boost ? `${resumeText} ${boost}`.trim() : resumeText;
}

/**
 * Fetch active (Open + not expired) jobs from MongoDB.
 */
async function fetchActiveJobs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Be lenient with legacy/partial job records:
  // - missing `status` should be treated as Open
  // - missing `deadline` should be treated as "not expired"
  return Job.find({
    $and: [
      {
        $or: [
          { status: "Open" },
          { status: { $exists: false } },
          { status: null },
          { status: "" },
        ],
      },
      {
        $or: [
          { deadline: { $gte: today } },
          { deadline: { $exists: false } },
          { deadline: null },
        ],
      },
    ],
  }).lean();
}

/* =========================================================
   POST /api/recommendations/me
========================================================= */
exports.getRecommendationsForMe = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.userId)) || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Always read the CURRENT state from MongoDB — never rely on cache.
    const profile = await CandidateProfile.findOne({ userId }).lean();

    // === CV GATE ===
    // Without a valid, extracted CV text, we NEVER return any jobs,
    // even if the user has set preferences or skills.
    const resumeText = safeTrim(profile && profile.resumeText);
    if (!resumeText || resumeText.length < MIN_RESUME_TEXT_LENGTH) {
      console.log(
        `[recommendations] No valid CV for user ${userId} — returning empty result.`
      );
      return res.status(200).json({
        success: true,
        hasCV: false,
        hasRecommendationData: false,
        count: 0,
        recommendations: [],
        message: NO_CV_MESSAGE,
      });
    }

    const candidateText = buildCandidateText(profile);

    // Paranoia guard — buildCandidateText should never return "" past
    // the CV gate, but if it does we fail closed.
    if (!candidateText) {
      return res.status(200).json({
        success: true,
        hasCV: true,
        hasRecommendationData: false,
        count: 0,
        recommendations: [],
        message: NO_CV_MESSAGE,
      });
    }

    const jobs = await fetchActiveJobs();

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        hasCV: true,
        hasRecommendationData: true,
        count: 0,
        recommendations: [],
        message: "No active jobs are available right now.",
      });
    }

    console.log(
      `[recommendations] user=${userId} resumeLen=${resumeText.length} textLen=${candidateText.length} jobs=${jobs.length}`
    );

    const candidateJobs = prefilterJobsByCvKeywords(candidateText, jobs);
    console.log(
      `[recommendations] prefilter: ${candidateJobs.length}/${jobs.length} jobs matched CV keywords`
    );

    // 1) Strict pass: high-precision matches.
    const strictResponse = await axios.post(
      AI_SERVICE_URL,
      {
        candidateText,
        jobs: candidateJobs,
        threshold: STRICT_AI_THRESHOLD,
        top_n: 10,
      },
      {
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const strictRecommendations = Array.isArray(strictResponse.data?.recommendations)
      ? strictResponse.data.recommendations
      : [];

    // Extra safety net: even if a zero-score sneaks through, drop it.
    let recommendations = strictRecommendations.filter((r) => {
      const score = typeof r.similarity_score === "number" ? r.similarity_score : 0;
      return score > 0;
    });

    // 2) If strict pass found nothing, do a relaxed pass.
    // This still keeps results CV-related (similarity based), unlike
    // showing random/latest jobs.
    if (recommendations.length === 0) {
      const relaxedResponse = await axios.post(
        AI_SERVICE_URL,
        {
          candidateText,
          jobs: candidateJobs,
          threshold: RELAXED_AI_THRESHOLD,
          top_n: 10,
        },
        {
          timeout: 15000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const relaxedRecommendations = Array.isArray(relaxedResponse.data?.recommendations)
        ? relaxedResponse.data.recommendations
        : [];
      recommendations = relaxedRecommendations.filter((r) => {
        const score = typeof r.similarity_score === "number" ? r.similarity_score : 0;
        return score > 0;
      });
    }

    if (recommendations.length === 0) {
      const keywordRanked = rankJobsByKeywordOverlap(candidateText, candidateJobs, 10);
      if (keywordRanked.length > 0) {
        return res.status(200).json({
          success: true,
          hasCV: true,
          hasRecommendationData: true,
          count: keywordRanked.length,
          recommendations: keywordRanked,
          message:
            "Showing CV-related jobs ranked by keyword overlap (fallback mode).",
        });
      }

      return res.status(200).json({
        success: true,
        hasCV: true,
        hasRecommendationData: true,
        count: 0,
        recommendations: [],
        message:
          "No CV-related jobs found right now. Try updating CV skills or adding more matching jobs.",
      });
    }

    return res.status(200).json({
      success: true,
      hasCV: true,
      hasRecommendationData: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("[recommendations] Error:", error.message);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNABORTED"
    ) {
      return res.status(503).json({
        success: false,
        message:
          "AI recommendation service is not reachable. Please make sure it is running on port 8000.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate recommendations.",
    });
  }
};
