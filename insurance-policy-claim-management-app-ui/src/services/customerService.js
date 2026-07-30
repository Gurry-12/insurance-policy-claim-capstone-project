import axiosInstance from "../api/axiosInstance";


export const getProfile = async () => {
  const response = await axiosInstance.get(
    "/customers/profile"
  );

  return response;
};

export const createProfile = async (payload) => {
  const response = await axiosInstance.post(
    `/customers`,
    payload
  );

  return response;
};

export const updateProfile = async (
  customerId,
  payload
) => {
  const response = await axiosInstance.put(
    `/customers/${customerId}`,
    payload
  );

  return response;
};


export const getAllCustomersPaginated = async (params = {}) => {
  const response = await axiosInstance.get('/customers/page', { params });
  return response;
}

export const getAllCustomers = async () => {
  const response = await axiosInstance.get("/customers");
  return response;
};


export const getCustomerById = async (customerId) => {
  const response = await axiosInstance.get(`/customers/${customerId}`);
  return response;
};
