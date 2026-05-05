import axios from "./axiosConfig";

export const getAdminInterviews = () => axios.get("/interview/all");
export const getAdminCandidates = () => axios.get("/getall/candidates");
export const getAdminJobs = () => axios.get("/getalljobs");