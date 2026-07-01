// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./user');
const productRoutes = require('./products');

const app = express();
const PORT = 3000;
// backend/server.js
app.use(cors({
  origin: ['http://localhost:8080', 'http://172.18.224.23:8080', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
// 中间件
app.use(bodyParser.json());

// 路由挂载
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    code: 200, 
    message: '后端服务运行中', 
    availableRoutes: [
      'POST /api/user/login - 用户登录',
      'GET /api/products - 获取产品列表(需认证)',
      'PUT /api/products/:id - 更新产品(需认证)'
    ] 
  });
});
// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});