import axios from "./axiosConfig";

export const getJobs = () => axios.get("/jobs");

export const createJob = (data) => axios.post("/jobs", data);

export const closeJobApi = (id) => axios.patch(`/jobs/${id}/close`);

export const updateJobApi = (id, data) =>
  axios.put(`/jobs/${id}`, data);

export const deleteJobApi = (id) =>
  axios.delete(`/jobs/${id}`);