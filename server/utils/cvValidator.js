/**
 * cvValidator.js
 * ----------------
 * Lightweight heuristic to decide whether the text extracted from an
 * uploaded document actually looks like a CV / resume. We use a simple
 * keyword-score approach — intentionally no ML — so it is fast,
 * explainable, and good enough for a university project.
 *
 *   score_cv     = how many CV-like words appear (unique hits)
 *   score_not_cv = how many lecture / tutorial-like words appear
 *
 * A file is accepted as a CV iff:
 *   - score_cv >= MIN_CV_SCORE, AND
 *   - score_cv > score_not_cv, AND
 *   - text length is at least MIN_TEXT_LENGTH characters
 */

const CV_KEYWORDS = [
  "education", "skills", "projects", "experience", "internship",
  "references", "linkedin", "github", "email", "phone",
  "curriculum vitae", "resume", "summary", "profile", "objective",
  "certifications", "certification", "achievements", "languages",
  "bachelor", "degree", "university", "college", "gpa",
  "employment", "work history", "technologies", "tools",
  "contact", "mobile", "address",
];

const NON_CV_KEYWORDS = [
  "lecture", "chapter", "unit", "definition", "introduction",
  "theory", "lesson", "assignment", "tutorial", "textbook",
  "module", "syllabus", "exercise", "quiz", "exam",
  "learning outcome", "learning outcomes", "worksheet",
  "homework", "problem set",
];

const MIN_CV_SCORE = 3;           // at least 3 CV keywords must appear
const MIN_TEXT_LENGTH = 150;      // PDFs with almost no text are rejected

/**
 * Count how many of the given keywords appear at least once in the text.
 * Matches are case-insensitive and use whole-word/phrase matching so
 * "educational" does not count as "education".
 */
function countKeywordHits(text, keywords) {
  const lower = text.toLowerCase();
  let hits = 0;

  for (const kw of keywords) {
    // Escape regex special chars just in case keywords evolve.
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(lower)) {
      hits += 1;
    }
  }

  return hits;
}

/**
 * Primary public API.
 *
 * @param {string} text  Plain text extracted from the uploaded document.
 * @returns {{
 *   isCV: boolean,
 *   cvScore: number,
 *   nonCvScore: number,
 *   length: number,
 *   reason: string,
 * }}
 */
function looksLikeCV(text) {
  const safeText = typeof text === "string" ? text.trim() : "";
  const length = safeText.length;

  if (length < MIN_TEXT_LENGTH) {
    return {
      isCV: false,
      cvScore: 0,
      nonCvScore: 0,
      length,
      reason:
        "The uploaded file does not contain enough readable text to be a CV.",
    };
  }

  const cvScore = countKeywordHits(safeText, CV_KEYWORDS);
  const nonCvScore = countKeywordHits(safeText, NON_CV_KEYWORDS);

  if (cvScore < MIN_CV_SCORE) {
    return {
      isCV: false,
      cvScore,
      nonCvScore,
      length,
      reason:
        "The file does not look like a CV. Please upload a real resume containing sections such as Education, Skills, Experience, Projects.",
    };
  }

  if (nonCvScore >= cvScore) {
    return {
      isCV: false,
      cvScore,
      nonCvScore,
      length,
      reason:
        "The file looks like lecture notes or course material, not a CV. Please upload your personal resume.",
    };
  }

  return {
    isCV: true,
    cvScore,
    nonCvScore,
    length,
    reason: "OK",
  };
}

module.exports = {
  looksLikeCV,
  CV_KEYWORDS,
  NON_CV_KEYWORDS,
  MIN_CV_SCORE,
  MIN_TEXT_LENGTH,
};
