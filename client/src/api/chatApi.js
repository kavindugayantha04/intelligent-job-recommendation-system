import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chat
export const sendMessage = (data) => API.post('/chat/send', data);
export const getChatHistory = (conversationId) =>
  API.get('/chat/history', { params: conversationId ? { conversationId } : {} });
export const createConversation = (data = {}) => API.post('/chat/new', data);
export const editChatMessage = (id, content) => API.put(`/chat/edit/${id}`, { content });
export const deleteChatMessage = (id) => API.delete(`/chat/delete/${id}`);
export const deleteConversation = (conversationId) =>
  API.delete(`/chat/conversation/${conversationId}`);

// CVs (multi CV support)
export const getCvs = () => API.get('/users/cvs');
export const selectCv = (cvId) => API.put(`/users/cvs/${cvId}/select`);
export const uploadAdditionalCv = (formData) =>
  API.post('/users/cvs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// FAQs
export const getFAQs = (params) => API.get('/faqs', { params });
export const getFAQById = (id) => API.get(`/faqs/${id}`);
export const createFAQ = (data) => API.post('/faqs', data);
export const updateFAQ = (id, data) => API.put(`/faqs/${id}`, data);
export const deleteFAQ = (id) => API.delete(`/faqs/${id}`);

// Error Triggers
export const getErrorTriggers = () => API.get('/faqs/errors/triggers');
export const createErrorTrigger = (data) => API.post('/faqs/errors/triggers', data);
export const updateErrorTrigger = (id, data) => API.put(`/faqs/errors/triggers/${id}`, data);
export const deleteErrorTrigger = (id) => API.delete(`/faqs/errors/triggers/${id}`);

// Logs
export const getLogs = (params) => API.get('/logs', { params });
export const getStats = () => API.get('/logs/stats');
export const deleteLog = (id) => API.delete(`/logs/${id}`);

export default API;
