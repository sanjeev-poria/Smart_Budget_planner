import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartfin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token is invalid or expired, clear local storage
      const token = localStorage.getItem('smartfin_token');
      if (token) {
        localStorage.removeItem('smartfin_token');
        localStorage.removeItem('smartfin_user');
        window.dispatchEvent(new Event('smartfin_auth_expired'));
      }
    }

    const detail = error.response?.data?.detail;
    let message = 'An unexpected error occurred';

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      // Pydantic validation error list
      message = detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
    } else if (error.message) {
      message = error.message;
    }

    const errorDetails = {
      message,
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(errorDetails);
  }
);

export default apiClient;
