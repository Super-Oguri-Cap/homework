// src/utils/axios.js
import axios from 'axios';

// src/api/request.js
const request = axios.create({
  // 走 Nginx 反向代理（同源，无跨域问题）
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：添加 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      // 处理 401 未授权
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // 跳转到登录页
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default request;