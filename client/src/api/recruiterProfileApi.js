import axios from "./axiosConfig";

export const getRecruiterProfileApi = () => axios.get("/recruiter/profile");

export const updateRecruiterProfileApi = (data) =>
  axios.put("/recruiter/profile", data);

export const changeRecruiterPasswordApi = (data) =>
  axios.put("/recruiter/change-password", data);