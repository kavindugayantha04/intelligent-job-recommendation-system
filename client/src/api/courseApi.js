import axios from "./axiosConfig";

/**
 * Fetch all courses (admin view) or filter by skill (candidate view).
 *
 *   getCourses()                -> all courses
 *   getCourses({ skill: "React" }) -> courses where relatedSkill === "React"
 */
export const getCourses = async ({ skill } = {}) => {
  const params = {};
  if (skill && skill.trim()) params.skill = skill.trim();
  const res = await axios.get("/courses", { params });
  return res.data;
};

export const getCourse = async (id) => {
  const res = await axios.get(`/courses/${id}`);
  return res.data;
};

export const createCourse = async (body) => {
  const res = await axios.post("/courses", body);
  return res.data;
};

export const updateCourse = async (id, body) => {
  const res = await axios.put(`/courses/${id}`, body);
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await axios.delete(`/courses/${id}`);
  return res.data;
};

/**
 * NEW: rule-based skill gap derived from AI recommendations.
 * Used by the merged Courses page (skill gaps shown above courses).
 *
 * Returns: {
 *   success, candidateSkills, missingSkills, analysedJobsCount, message
 * }
 */
export const getCourseSkillGaps = async () => {
  const res = await axios.get("/courses/skill-gaps/me");
  return res.data;
};
