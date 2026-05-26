import axios from "./axiosConfig";

/**
 * MCQ Questions API.
 * Backend route: /api/questions
 */

export const getQuestions = async ({ skill } = {}) => {
  const params = {};
  if (skill && skill.trim()) params.skill = skill.trim();
  const res = await axios.get("/questions", { params });
  return res.data;
};

export const getSkills = async () => {
  const res = await axios.get("/questions/skills");
  return res.data;
};

export const createQuestion = async (body) => {
  const res = await axios.post("/questions", body);
  return res.data;
};

export const updateQuestion = async (id, body) => {
  const res = await axios.put(`/questions/${id}`, body);
  return res.data;
};

export const deleteQuestion = async (id) => {
  const res = await axios.delete(`/questions/${id}`);
  return res.data;
};
