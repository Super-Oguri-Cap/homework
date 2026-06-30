// src/api/user.js
import request from '../utils/axios';

export const login = (username, password) => {
  return request.post('/user/login', { username, password });
};