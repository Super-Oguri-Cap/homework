// backend/cart.js
// 购物车路由 — 基于 SQLite models
const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/auth');
const cartModel = require('./models/cart');

// 获取购物车列表
router.get('/', authMiddleware, (req, res) => {
  try {
    const data = cartModel.findByUserId(req.userId);
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 添加商品到购物车
router.post('/', authMiddleware, (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ code: 400, message: '缺少商品 ID' });
    }
    const data = cartModel.addItem(req.userId, productId, quantity);
    res.json({ code: 200, message: '添加成功', data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 更新购物车商品数量
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { quantity } = req.body;
    const data = cartModel.updateQuantity(req.params.id, quantity, req.userId);
    // 如果返回了完整购物车，说明操作成功
    if (Array.isArray(data)) {
      res.json({ code: 200, message: '更新成功', data });
    } else {
      res.status(404).json({ code: 404, message: '购物车项不存在' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 切换选中状态
router.put('/:id/select', authMiddleware, (req, res) => {
  try {
    const data = cartModel.toggleSelect(req.params.id, req.userId);
    res.json({ code: 200, message: '切换成功', data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 全选/取消全选
router.put('/select/all', authMiddleware, (req, res) => {
  try {
    const { selected } = req.body;
    const data = cartModel.selectAll(req.userId, selected !== false);
    res.json({ code: 200, message: '操作成功', data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 删除购物车商品
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const data = cartModel.removeItem(req.params.id, req.userId);
    res.json({ code: 200, message: '删除成功', data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 清空已选中的购物车商品（下单后调用）
router.delete('/clear/selected', authMiddleware, (req, res) => {
  try {
    const data = cartModel.clearSelected(req.userId);
    res.json({ code: 200, message: '清空成功', data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;