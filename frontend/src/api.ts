import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8888/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
