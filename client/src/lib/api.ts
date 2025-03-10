import axios from 'axios';
import { auth } from './firebase';

// Create axios instance
const api = axios.create({
  baseURL: '/',
  withCredentials: true, // Important for cookies/session
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the Firebase ID token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error getting ID token:", error);
      }
    }

    // Add CSRF token if available
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle CSRF tokens and common errors
api.interceptors.response.use(
  (response) => {
    // Store CSRF token if it's in the response
    if (response.data?.csrfToken) {
      localStorage.setItem('csrfToken', response.data.csrfToken);
    }
    return response;
  },
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication error, redirecting to login');
      // Optional: Redirect to login page
      // window.location.href = '/auth';
    }

    // Handle CSRF errors
    if (error.response?.status === 403 && 
        error.response?.data?.message?.includes('CSRF')) {
      console.warn('CSRF token error, fetching a new token');
      try {
        const response = await axios.get('/api/csrf-token', { withCredentials: true });
        if (response.data?.csrfToken) {
          localStorage.setItem('csrfToken', response.data.csrfToken);
        }
      } catch (tokenError) {
        console.error('Failed to fetch new CSRF token:', tokenError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };