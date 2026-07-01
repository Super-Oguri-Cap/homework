// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { initDatabase } = require('./database/db');

const userRoutes = require('./user');
const productRoutes = require('./products');
const cartRoutes = require('./cart');
const orderRoutes = require('./order');
const addressRoutes = require('./address');

const app = express();
const PORT = 3000;

// 初始化数据库
initDatabase();

app.use(cors({
  origin: ['http://localhost:8080', 'http://172.18.224.23:8080', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 中间件
app.use(bodyParser.json());

// 路由挂载
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '后端服务运行中（SQLite 数据持久化）',
    availableRoutes: [
      'POST /api/user/login - 用户登录',
      'POST /api/user/register - 用户注册',
      'GET  /api/products - 获取商品列表',
      'GET  /api/products/:id - 获取商品详情',
      'PUT  /api/products/:id - 更新商品',
      'POST /api/products - 新增商品',
      'DELETE /api/products/:id - 删除商品',
      'GET  /api/cart - 获取购物车',
      'POST /api/cart - 添加购物车',
      'PUT  /api/cart/:id - 更新数量',
      'DELETE /api/cart/:id - 删除项',
      'PUT  /api/cart/:id/select - 切换选中',
      'PUT  /api/cart/select/all - 全选/取消',
      'DELETE /api/cart/clear/selected - 清空选中',
      'POST /api/orders - 创建订单',
      'GET  /api/orders - 订单列表',
      'GET  /api/orders/:id - 订单详情',
      'PUT  /api/orders/:id/cancel - 取消订单',
      'GET  /api/addresses - 地址列表',
      'POST /api/addresses - 添加地址',
      'PUT  /api/addresses/:id - 更新地址',
      'DELETE /api/addresses/:id - 删除地址',
      'PUT  /api/addresses/:id/default - 设为默认',
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
