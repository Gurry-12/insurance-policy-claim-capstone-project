import axios from 'axios';
import NProgress from 'nprogress';

import { parseSuccessResponse, parseErrorResponse } from './apiAdapter';

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
});

axiosInstance.interceptors.request.use(
  (config) => {
    startProgress();
    // Let the browser set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const token = localStorage.getItem('ss_token');
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
  (error) => {
    finishProgress();
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('ss_token');
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
