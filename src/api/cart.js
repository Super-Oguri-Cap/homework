// src/api/cart.js
import request from '../utils/axios';

export const getCart = () => {
  return request.get('/cart');
};

export const addToCart = (productId, quantity = 1) => {
  return request.post('/cart', { productId, quantity });
};

export const updateCartItem = (id, quantity) => {
  return request.put(`/cart/${id}`, { quantity });
};

export const removeCartItem = (id) => {
  return request.delete(`/cart/${id}`);
};

export const toggleSelect = (id) => {
  return request.put(`/cart/${id}/select`);
};

export const selectAll = (selected) => {
  return request.put('/cart/select/all', { selected });
};

export const clearSelectedItems = () => {
  return request.delete('/cart/clear/selected');
};
