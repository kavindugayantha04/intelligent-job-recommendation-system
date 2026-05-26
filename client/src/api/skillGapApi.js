import axios from "./axiosConfig";

/**
 * Fetch the rule-based skill gap for the current candidate.
 * Returns: { success, candidateSkills, missingSkills, jobsAnalyzed }
 */
export const getMySkillGap = async () => {
  const res = await axios.get("/skill-gap/me");
  return res.data;
};

/**
 * Send a quiz score to the backend for rule-based evaluation.
 * Returns: { success, percentage, action, message, ... }
 *
 *   action === "CV_IMPROVEMENT"  -> percentage >= 80
 *   action === "PRACTICE"        -> percentage >= 50
 *   action === "COURSE"          -> percentage <  50
 */
export const evaluateMyScore = async ({ skill, score, totalQuestions }) => {
  const res = await axios.post("/skill-gap/evaluate", {
    skill,
    score,
    totalQuestions,
  });
  return res.data;
};
