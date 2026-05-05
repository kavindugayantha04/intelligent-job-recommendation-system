const axios = require('axios')

const CandidateProfile = require('../models/CandidateProfile')
const Job = require('../models/Job')

const {
  extractKnownSkillsFromText,
  mergeSkillsCaseInsensitive,
  normalizeSkill,
} = require('../utils/knownSkills')

/* =========================================================
   CONFIG
========================================================= */
const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://localhost:8000/recommend'

const MIN_RESUME_TEXT_LENGTH = 100

const NO_DATA_MESSAGE =
  'Upload your CV or complete your profile to identify skill gaps.'

/* =========================================================
   Shared helpers
========================================================= */

function buildCandidateText(profile) {
  if (!profile) return ''

  const resumeText = String(profile.resumeText || '').trim()
  if (!resumeText || resumeText.length < MIN_RESUME_TEXT_LENGTH) return ''

  const preferredField = String(profile.preferredField || '').trim()
  const desiredRole = String(profile.desiredRole || '').trim()
  const skillsArray = Array.isArray(profile.skills) ? profile.skills : []
  const skills = skillsArray
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(' ')

  const boost = [preferredField, desiredRole, skills].filter(Boolean).join(' ')
  return boost ? `${resumeText} ${boost}`.trim() : resumeText
}

async function fetchActiveJobs() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Job.find({
    status: 'Open',
    $or: [
      { deadline: { $gte: today } },
      { deadline: null },
      { deadline: { $exists: false } },
    ],
  })
    .select('title mandatorySkills preferredSkills')
    .lean()
}

/**
 * Get the jobs we should compare candidate skills against.
 * - First try the AI recommendation microservice.
 * - If it returns recommended jobs, use those.
 * - Otherwise, fall back to the (most recent) active jobs.
 *
 * Pure rule-based: we only USE the AI as a relevance filter for which
 * jobs to consider — we never use it to detect skill gaps themselves.
 */
async function getRelevantJobs(profile) {
  const activeJobs = await fetchActiveJobs()
  if (activeJobs.length === 0) return []

  const candidateText = buildCandidateText(profile)
  if (!candidateText) {
    return activeJobs.slice(0, 20) // newest first (Mongo default sort)
  }

  try {
    const aiResponse = await axios.post(
      AI_SERVICE_URL,
      { candidateText, jobs: activeJobs },
      { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
    )

    const recs = Array.isArray(aiResponse.data?.recommendations)
      ? aiResponse.data.recommendations
      : []

    if (recs.length > 0) {
      const recIds = new Set(recs.map((r) => String(r._id)))
      const matched = activeJobs.filter((j) => recIds.has(String(j._id)))
      if (matched.length > 0) return matched
    }
  } catch (e) {
    console.warn(
      '[skill-gap] AI service unavailable, falling back to active jobs:',
      e.message
    )
  }

  return activeJobs.slice(0, 20)
}

/**
 * Aggregate ONLY the curated array fields from jobs.
 * Returns Map<lowerCaseSkill, originalCasing>.
 *
 * We never read free-form text from job descriptions — that's where
 * junk skills would come from.
 */
function aggregateRequiredSkills(jobs) {
  const map = new Map()
  for (const job of jobs) {
    const list = [
      ...(Array.isArray(job.mandatorySkills) ? job.mandatorySkills : []),
      ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : []),
    ]
    for (const raw of list) {
      const skill = String(raw || '').trim()
      if (!skill) continue
      const key = skill.toLowerCase()
      if (!map.has(key)) map.set(key, skill)
    }
  }
  return map
}

/* =========================================================
   GET /api/skill-gap/me   (legacy, kept for backward compat)
========================================================= */
exports.getMySkillGap = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.userId)) || req.userId

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const profile = await CandidateProfile.findOne({ userId }).lean()

    const candidateSkillsRaw = Array.isArray(profile?.skills)
      ? profile.skills
      : []
    const candidateSkillSet = new Set(
      candidateSkillsRaw.map(normalizeSkill).filter(Boolean)
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const jobs = await Job.find({
      status: 'Open',
      $or: [
        { deadline: { $gte: today } },
        { deadline: null },
        { deadline: { $exists: false } },
      ],
    })
      .select('title mandatorySkills preferredSkills')
      .lean()

    const requiredMap = aggregateRequiredSkills(jobs)

    const missingSkills = []
    for (const [key, original] of requiredMap.entries()) {
      if (!candidateSkillSet.has(key)) missingSkills.push(original)
    }

    return res.status(200).json({
      success: true,
      candidateSkills: candidateSkillsRaw,
      missingSkills,
      jobsAnalyzed: jobs.length,
    })
  } catch (error) {
    console.error('[skill-gap] error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to compute skill gap.',
    })
  }
}

/* =========================================================
   POST /api/skill-gap/evaluate
========================================================= */
exports.evaluateScore = async (req, res) => {
  try {
    const { score, totalQuestions, skill } = req.body || {}

    const correct = Number(score) || 0
    const total = Number(totalQuestions) || 0
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

    let action, message
    if (percentage >= 80) {
      action = 'CV_IMPROVEMENT'
      message = `You already know ${skill || 'this skill'}. Add it to your CV.`
    } else if (percentage >= 50) {
      action = 'PRACTICE'
      message = `You have basic knowledge of ${skill || 'this skill'}. Practice more.`
    } else {
      action = 'COURSE'
      message = `Skill gap confirmed for ${skill || 'this skill'}. Take a course.`
    }

    return res.status(200).json({
      success: true,
      skill: skill || null,
      score: correct,
      totalQuestions: total,
      percentage,
      action,
      message,
    })
  } catch (error) {
    console.error('[skill-gap] evaluateScore error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to evaluate score.',
    })
  }
}

/* =========================================================
   GET /api/courses/skill-gaps/me
   ---------------------------------------------------------
   PRIMARY endpoint used by the merged Courses page.

   Strict rules (no "all skills marked as missing" when the
   candidate has no usable data):

     A. Load the candidate profile.

     B. EARLY EXIT GATE (per spec):
          If profile.resume is empty
          AND profile.resumeText is empty
          AND profile.skills is empty
          → return an empty state with the canonical
            "Upload your CV…" message.
          Do NOT load jobs. Do NOT compute missing skills.

     C. Build candidate skills:
          profile.skills (curated, trusted)
          + whitelisted skills extracted from resumeText
            (only when resumeText actually has content).

     D. DEFENSIVE GATE:
          If, after extraction, we still have 0 candidate
          skills, treat the candidate as having no usable
          skill data and return the same empty state —
          we will NOT label every job skill as "missing"
          just because the candidate set is empty.

     E. Compare against jobs:
          - Try AI-recommended jobs.
          - Fall back to recent active jobs.
          - Aggregate ONLY mandatorySkills + preferredSkills
            (never job description text).
          - missingSkills = required − candidate (case-insensitive).
========================================================= */
exports.getCourseSkillGaps = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.userId)) || req.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    const emptyStatePayload = {
      success: true,
      candidateSkills: [],
      missingSkills: [],
      analysedJobsCount: 0,
      message: NO_DATA_MESSAGE,
    }

    const profile = await CandidateProfile.findOne({ userId }).lean()

    // (A) No profile document at all → empty state.
    if (!profile) {
      return res.status(200).json(emptyStatePayload)
    }

    // Curated profile skills (user-entered).
    const profileSkills = (Array.isArray(profile.skills) ? profile.skills : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)

    // CV file path on disk — empty/null means "no CV uploaded".
    const resumeFile = String(profile.resume || '').trim()
    const hasResume = resumeFile.length > 0

    // Plain-text version of the CV — only counts as "data" if it has chars.
    const resumeText = String(profile.resumeText || '').trim()
    const hasResumeText = resumeText.length > 0

    /* -----------------------------------------------------
       (B) EARLY EXIT GATE — per spec:
       "If profile.resume is empty AND profile.resumeText
        is empty AND candidateSkills length is 0, return
        the empty state and do NOT continue skill gap
        calculation."

       We approximate "candidateSkills length is 0" by
       "no curated profile.skills" here, because we haven't
       extracted from the CV yet — and per spec, no CV
       means there's nothing to extract anyway.
    ----------------------------------------------------- */
    if (!hasResume && !hasResumeText && profileSkills.length === 0) {
      return res.status(200).json(emptyStatePayload)
    }

    /* -----------------------------------------------------
       (C) Build candidate skills.
       resumeText is only scanned when it actually exists,
       and only whitelisted skills are extracted (no
       random words like "her", "tbt", "owemglc").
    ----------------------------------------------------- */
    const resumeSkills = hasResumeText
      ? extractKnownSkillsFromText(resumeText)
      : []

    const candidateSkills = mergeSkillsCaseInsensitive(
      profileSkills,
      resumeSkills
    )

    /* -----------------------------------------------------
       (D) DEFENSIVE GATE
       If everything netted out to zero (e.g. the CV had
       text but no recognisable skills, and the candidate
       hasn't filled in profile.skills), don't pretend the
       whole job catalogue is "missing". Show empty state.
    ----------------------------------------------------- */
    if (candidateSkills.length === 0) {
      return res.status(200).json(emptyStatePayload)
    }

    /* -----------------------------------------------------
       (E) Pick jobs and compute missing skills.
    ----------------------------------------------------- */
    const jobs = await getRelevantJobs(profile)

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        candidateSkills,
        missingSkills: [],
        analysedJobsCount: 0,
        message: 'No active jobs are available right now.',
      })
    }

    // Aggregate ONLY clean array fields — never description text.
    const requiredMap = aggregateRequiredSkills(jobs)

    const candidateLower = new Set(candidateSkills.map(normalizeSkill))
    const missingSkills = []
    for (const [key, original] of requiredMap.entries()) {
      if (!candidateLower.has(key)) missingSkills.push(original)
    }

    const message =
      missingSkills.length === 0
        ? 'No major skill gaps found.'
        : `Found ${missingSkills.length} skill gap${missingSkills.length === 1 ? '' : 's'} from ${jobs.length} matching job${jobs.length === 1 ? '' : 's'}.`

    return res.status(200).json({
      success: true,
      candidateSkills,
      missingSkills,
      analysedJobsCount: jobs.length,
      message,
    })
  } catch (error) {
    console.error('[skill-gap] getCourseSkillGaps error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to compute skill gap.',
    })
  }
}
