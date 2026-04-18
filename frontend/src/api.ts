import axios from 'axios';

export const API_BASE_URL = 'https://qsd.fly.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
