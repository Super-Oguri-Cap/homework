// src/api/address.js
import request from '../utils/axios';

export const getAddresses = () => {
  return request.get('/addresses');
};

export const addAddress = (data) => {
  return request.post('/addresses', data);
};

export const updateAddress = (id, data) => {
  return request.put(`/addresses/${id}`, data);
};

export const deleteAddress = (id) => {
  return request.delete(`/addresses/${id}`);
};

export const setDefaultAddress = (id) => {
  return request.put(`/addresses/${id}/default`);
};
