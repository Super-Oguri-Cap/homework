// backend/products.js
// 商品路由 — 基于 SQLite models
const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/auth');
const productModel = require('./models/product');

// 获取所有商品（需要认证）
router.get('/', authMiddleware, (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 50 } = req.query;
    const data = productModel.findAll({
      category,
      keyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    res.json({ code: 200, data: data.list });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取商品详情
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const product = productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    res.json({ code: 200, data: product });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 新增商品
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, price, description, category, image, stock } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ code: 400, message: '商品名称和价格必填' });
    }
    const product = productModel.create({ name, price, description, category, image, stock });
    res.json({ code: 200, message: '创建成功', data: product });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 更新商品
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, price, description, category, image, stock, status } = req.body;
    const fields = { name, price, description, category, image, stock, status };
    for (const key of Object.keys(fields)) {
      if (fields[key] === undefined) delete fields[key];
    }
    const product = productModel.update(req.params.id, fields);
    res.json({ code: 200, message: '更新成功', data: product });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 删除商品
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = productModel.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;