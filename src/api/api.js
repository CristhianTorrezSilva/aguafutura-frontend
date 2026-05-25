import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';

  if (token) {
    config.headers.Authorization = `${tokenType} ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (status === 403) {
      window.dispatchEvent(new Event('auth:forbidden'));
    }

    return Promise.reject(error);
  }
);

export default api;
