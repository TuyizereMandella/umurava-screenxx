import axios from 'axios';

// Create a centralized Axios instance .
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT token if it exists
api.interceptors.request.use(
  (config) => {
    // Only run on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Prevent redirect loop if already on login page
        if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/auth/signin')) {
          window.location.href = '/auth/signin';
        }
      }
    }
    return Promise.reject(error);
  }
);
