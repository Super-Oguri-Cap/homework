// src/api/product.js
import request from '../utils/axios';

export const getProducts = () => {
  return request.get('/products');
};

export const updateProduct = (id, data) => {
  return request.put(`/products/${id}`, data);
};