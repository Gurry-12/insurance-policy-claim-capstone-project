import axiosInstance from "../api/axiosInstance";


export const getAllProducts = async () => {
  const response = await axiosInstance.get("/products/active");
  return response;
};

export const getAllProductsPaginated = async (params = {}) => {
  const response = await axiosInstance.get("/products/page", { params });
  return response;
};

export const getProductById = async (productId) => {
  const response = await axiosInstance.get(`/products/${productId}`);
  return response;
};


export const createProduct = async (payload) => {
  const response = await axiosInstance.post('/products', payload);
  return response;
};

export const updateProduct = async (productId, payload) => {
  const response = await axiosInstance.put(`/products/${productId}`, payload);
  return response;
};

export const activateProduct = async (productId) => {
  const response = await axiosInstance.patch(`/products/${productId}/activate`);
  return response;
};

export const deactivateProduct = async (productId) => {
  const response = await axiosInstance.patch(`/products/${productId}/deactivate`);
  return response;
};


export const getActiveProducts = async () => {
  const response = await axiosInstance.get(
    "/products/active"
  );

  return response;
};

