import axios from 'axios';
import NProgress from 'nprogress';

import { parseSuccessResponse, parseErrorResponse } from './apiAdapter';
import { getToken, setToken, clearToken } from './tokenStore';

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.08, trickleSpeed: 200 });

// Track concurrent requests — only hide bar when all are done
let activeRequests = 0;
// Track when the bar was last started to enforce minimum visible duration
let progressStartedAt = 0;
const MIN_VISIBLE_MS = 300;

const startProgress = () => {
  if (activeRequests === 0) {
    NProgress.start();
    progressStartedAt = Date.now();
  }
  activeRequests++;
};

const finishProgress = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    const elapsed = Date.now() - progressStartedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setTimeout(() => NProgress.done(), remaining);
  }
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Single-flight refresh: concurrent 401s share one refresh call instead of
// hammering the server with parallel requests.
let pendingRefreshPromise = null;

const refreshAccessToken = () => {
  if (pendingRefreshPromise) return pendingRefreshPromise;
  pendingRefreshPromise = axios
    .post(`${BASE_URL}/auth/refresh`, null, { 
      withCredentials: true,
      headers: getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}
    })
    .then((response) => response.data?.data?.accessToken)
    .catch(() => {
      clearToken();
      localStorage.removeItem('ss_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return Promise.reject(new Error('Refresh token invalid'));
    })
    .finally(() => {
      pendingRefreshPromise = null;
    });
  return pendingRefreshPromise;
};

axiosInstance.interceptors.request.use(
  (config) => {
    startProgress();
    // Let the browser set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    finishProgress();
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    finishProgress();
    return parseSuccessResponse(response);
  },
  async (error) => {
    finishProgress();
    const status = error.response?.status;
    const originalRequest = error.config;
    const isAuthCall = originalRequest?.url?.includes('/auth/');

    // A 401 on any protected call triggers a silent refresh once. If it
    // succeeds the original request is retried with the new access token.
    if (status === 401 && !isAuthCall && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
          window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: newToken }));
          return axiosInstance(originalRequest);
        }
      } catch {
        // Session truly expired — 'auth:unauthorized' was already dispatched.
        return Promise.reject(parseErrorResponse(error));
      }
    }

    if (status === 401) {
      clearToken();
      localStorage.removeItem('ss_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    } else if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden'));
    } else if (status >= 500 || !error.response) {
      window.dispatchEvent(new CustomEvent('api:error', { detail: parseErrorResponse(error).message }));
    }
    return Promise.reject(parseErrorResponse(error));
  }
);

export default axiosInstance;
