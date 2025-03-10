
import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies
});

// Request interceptor for adding auth token and CSRF token
api.interceptors.request.use(async (config) => {
  // Get auth token from localStorage or other source
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // For non-GET requests, get and add CSRF token
  if (config.method !== 'get') {
    try {
      // Get CSRF token if we don't have it cached
      if (!window.csrfToken) {
        const response = await axios.get('/api/csrf-token');
        window.csrfToken = response.data.csrfToken;
      }
      config.headers['X-CSRF-Token'] = window.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response.status === 401 && 
        error.response.data.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Trigger a token refresh
        await refreshAuthToken();
        
        // Get the new token
        const newToken = localStorage.getItem('authToken');
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to refresh the auth token
async function refreshAuthToken() {
  // Implementation depends on your authentication strategy
  // This is a placeholder
  console.log('Refreshing auth token...');
  
  // Example implementation using Firebase
  // const user = firebase.auth().currentUser;
  // if (user) {
  //   const newToken = await user.getIdToken(true);
  //   localStorage.setItem('authToken', newToken);
  // }
}

export default api;
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
