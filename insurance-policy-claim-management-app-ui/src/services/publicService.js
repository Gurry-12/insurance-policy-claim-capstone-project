import axiosInstance from '../api/axiosInstance';

export const getPlatformStats = async () => {
  const response = await axiosInstance.get('/public/stats');
  return response.data?.data || response.data;
};

export default getPlatformStats;
