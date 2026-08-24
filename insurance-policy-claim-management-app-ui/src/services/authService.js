import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import { jwtDecode } from 'jwt-decode';

export const login = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  const payload = response.data; // Now payload is the actual data object
  const decoded = jwtDecode(payload.token);

  const user = {
    id: payload.userId,
    email: payload.email || decoded.sub,
    role: payload.role || (decoded.role ?? decoded.roles?.[0] ?? null),
    name: payload.fullName || (decoded.fullName ?? decoded.name ?? decoded.sub),
    productSpeciality: payload.productSpeciality || decoded.productSpeciality || null,
  };

  return { token: payload.token, user, message: response.message };
};

export const register = async (userData) => {
  
  const response = await axiosInstance.post('/auth/register', userData);
  return response;
};

export const verifyOtpApi = async (payload) => {
  const response = await axiosInstance.post('/auth/verify-otp', payload);
  return response;
};


export const resendOtpApi = async (payload) => {
  const response = await axiosInstance.post('/auth/resend-otp', payload);
  return response;
};


export const forgotPasswordApi = async (payload) => {
  const response = await axiosInstance.post('/auth/forgot-password', payload);
  return response;
};

export const resetPasswordApi = async (payload) => {
  const response = await axiosInstance.post('/auth/reset-password', payload);
  return response;
};

export const refreshSession = async () => {
  const response = await axiosInstance.post('/auth/refresh');
  return response.data.accessToken;
};

export const logout = async (token) => {
  try {
    await axios.post(import.meta.env.VITE_API_BASE_URL + '/auth/logout', null, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch {
    // Best-effort server-side revocation; the local session is already cleared.
  }
};

