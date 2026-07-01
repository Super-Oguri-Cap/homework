// src/api/order.js
import request from '../utils/axios';

export const createOrder = (data) => {
  return request.post('/orders', data);
};

export const getOrders = (params = {}) => {
  return request.get('/orders', { params });
};

export const getOrderDetail = (id) => {
  return request.get(`/orders/${id}`);
};

export const cancelOrder = (id) => {
  return request.put(`/orders/${id}/cancel`);
};
