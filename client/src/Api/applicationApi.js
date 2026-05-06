import axios from "./axiosConfig";

export const applyToJob = async (data) => {
  return axios.post("/applications", data);
};

export const getMyApplications = async () => {
  return axios.get("/applications/my");
};

export const withdrawApplication = async (id) => {
  return axios.delete(`/applications/${id}`);
};
