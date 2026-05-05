import axios from "./axiosConfig";

export const getInterviewJobs = () => axios.get("/getalljobs");
export const getInterviewCandidates = () => axios.get("/getall/candidates");

export const createInterviewApi = (data) =>
  axios.post("/interview/create", data);

export const getAllInterviews = () => axios.get("/interview/all");

export const getInterviewById = (id) => axios.get(`/interview/${id}`);

export const updateInterviewApi = (id, data) =>
  axios.put(`/interview/${id}`, data);

export const deleteInterviewApi = (id) =>
  axios.delete(`/interview/${id}`);