# Frontend Integration: Axios Interceptor & Automatic Token Refresh

---

## 1. Overview
The React frontend uses an **Axios Interceptor** to automatically refresh expired Access Tokens without disrupting the user experience or requiring a manual re-login.

---

## 2. Recommended Implementation (`src/api/axios.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  withCredentials: true // IMPORTANT: Sends HttpOnly refresh_token cookie
});

// Request Interceptor: Attach current Access Token from memory
api.interceptors.request.use(
  (config) => {
    const token = window.__accessToken; // Or retrieve from AuthContext/Zustand store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 and refresh automatically
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          'http://localhost:8081/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.token;
        window.__accessToken = newAccessToken; // Update in-memory token

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Automatically redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```
