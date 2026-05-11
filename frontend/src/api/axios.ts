import axios from 'axios';
import toast from 'react-hot-toast';
import alerts from '../utils/alerts';

// Strict environment validation
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("Critical: VITE_API_BASE_URL is not defined in .env");
  // In development, we might want to throw, but in production we should at least log heavily.
}

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];
let isSessionAlertShowing = false;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor — attach auth token and correlation ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add Correlation ID for end-to-end tracing
  config.headers['X-Request-Id'] = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor — global error handling with toasts and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // Handle 401 Unauthorized or Specific Expired Token code
    if ((status === 401 || errorCode === 'TOKEN_EXPIRED') && !originalRequest._retry) {
      // If the request that failed is already the refresh request, 
      // do not retry it, just fail and logout.
      if (originalRequest.url?.includes('/auth/refresh')) {
        isRefreshing = false;
        failedQueue = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        const isPublicPage = 
          window.location.pathname.includes('/login') || 
          window.location.pathname.includes('/register') || 
          window.location.pathname.includes('/setup-account');

        if (!isPublicPage && !isSessionAlertShowing && localStorage.getItem('accessToken')) {
          isSessionAlertShowing = true;
          // Save current URL for route restoration
          sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
          
          alerts.sessionExpired().then(() => {
            isSessionAlertShowing = false;
            window.location.href = '/login?expired=true';
          });
        }
        return Promise.reject(error);
      }

      // If we are already refreshing, queue the request
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function(resolve, reject) {
        api.post('/auth/refresh', {}, { _retry: true } as any)
          .then(({ data }) => {
            const { accessToken, user } = data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update default headers for subsequent requests
            api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
            originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
            
            processQueue(null, accessToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            // Clear everything if refresh fails
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            const isPublicPage = 
              window.location.pathname.includes('/login') || 
              window.location.pathname.includes('/register') || 
              window.location.pathname.includes('/setup-account');

            if (!isPublicPage && !isSessionAlertShowing) {
              isSessionAlertShowing = true;
              // Save current URL for route restoration
              sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);

              alerts.sessionExpired().then(() => {
                isSessionAlertShowing = false;
                window.location.href = '/login?expired=true';
              });
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // Handle Network Errors (ERR_NETWORK)
    if (error.code === 'ERR_NETWORK') {
      console.error("Backend not reachable - Network Error");
      toast.error(navigator.onLine 
        ? 'Server is unreachable. Please try again later.' 
        : 'No internet connection detected.');
      return Promise.reject(error);
    }

    // AUTH CHECK: If the error was a 401 that just failed refresh, don't show generic 500 error
    const isAuthError = status === 401 || errorCode === 'TOKEN_EXPIRED';
    const isRefreshAttempt = originalRequest.url?.includes('/auth/refresh');

    if (isAuthError || isRefreshAttempt) {
       // Already handled or will be handled by auth redirect
       return Promise.reject(error);
    }

    // Other error handling using Friendly Alerts
    const message = error.response?.data?.error || error.response?.data?.message || error.code || 'Something went wrong';
    
    if (status === 403) {
      alerts.friendlyError('Permission denied');
    } else if (status >= 500) {
      alerts.friendlyError('Internal server error - ' + message);
    } else if (!status) {
      alerts.friendlyError('ERR_NETWORK - Server connection lost');
    } else if (status === 400) {
      alerts.friendlyError(message);
    }

    return Promise.reject(error);
  }
);

export default api;
