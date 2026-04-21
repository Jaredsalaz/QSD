import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Default to same-origin API route to avoid mixed content under HTTPS.
export const API_BASE_URL = envBaseUrl?.trim() || '/api';

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
