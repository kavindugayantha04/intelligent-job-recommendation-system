import API from "./axiosConfig";

// Get all recruiters
export const getRecruiters = () => API.get("/recruiters");

// Register recruiter
export const registerRecruiter = (data) =>
  API.post("/recruiter/registration", data);

// Delete recruiter
export const deleteRecruiter = (id) =>
  API.delete(`/recruiter/delete/${id}`);