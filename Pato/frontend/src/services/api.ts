import axios from 'axios';

// Warn in non-production when no API URL is provided so hosts notice the fallback.
if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_API_URL) {
   
  console.warn(
    'NEXT_PUBLIC_API_URL is not set; frontend will use localhost fallback. Set NEXT_PUBLIC_API_URL in your environment for production.'
  );
}

const api = axios.create({
  // Ensure a working default in dev if NEXT_PUBLIC_API_URL is not set
  // Expected format: e.g., http://localhost:5001/api
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
});

// Interceptor to add the auth token to every request if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
