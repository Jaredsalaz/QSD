import axios from 'axios';

export const API_BASE_URL = 'http://51.89.23.206:8888/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auto-attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qsd_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
