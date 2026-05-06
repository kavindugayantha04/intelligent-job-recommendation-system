import axios from "./axiosConfig";

/**
 * Fetch AI-powered job recommendations for the current user.
 * Uses the shared axios instance so the JWT is attached automatically.
 *
 * @returns {Promise<{ success: boolean, count: number, recommendations: any[] }>}
 */
export const getMyRecommendations = async () => {
  const res = await axios.post("/recommendations/me");
  return res.data;
};
