// backend/products.js
const express = require('express');
const router = express.Router();

// 模拟产品数据
let products = [
  { id: 1, name: '笔记本电脑', price: 5999, stock: 10 },
  { id: 2, name: '智能手机', price: 3999, stock: 25 },
  { id: 3, name: '无线耳机', price: 499, stock: 50 }
];

// 中间件：验证 token（简单实现）
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权' });
  }
  next();
};

// 获取所有产品（需要认证）
router.get('/', authMiddleware, (req, res) => {
  res.json({ code: 200, data: products });
});

// 更新产品（需要认证）
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, stock } = req.body;
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '产品不存在' });
  }
  
  // 更新字段
  if (name) product.name = name;
  if (price) product.price = price;
  if (stock !== undefined) product.stock = stock;
  
  res.json({ code: 200, message: '更新成功', data: product });
});

module.exports = router;