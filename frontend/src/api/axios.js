import axios from 'axios';

const api = axios.create({
  baseURL: 'https://notenest-backend-n4i4.onrender.com/api',
});

// Request Interceptor: Automatically attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;