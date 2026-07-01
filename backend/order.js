// backend/order.js
// 订单路由 — 基于 SQLite models
const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/auth');
const orderModel = require('./models/order');
const cartModel = require('./models/cart');
const productModel = require('./models/product');

// 创建订单
router.post('/', authMiddleware, (req, res) => {
  try {
    const { addressId, payMethod = 'wechat', remark = '', items } = req.body;

    if (!addressId) {
      return res.status(400).json({ code: 400, message: '请选择收货地址' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 400, message: '订单商品不能为空' });
    }

    // 从数据库查询商品信息，构建完整明细
    const enrichedItems = [];
    for (const item of items) {
      const product = productModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ code: 404, message: `商品 ID ${item.productId} 不存在` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ code: 400, message: `商品「${product.name}」库存不足` });
      }
      enrichedItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        totalPrice: Math.round(product.price * item.quantity * 100) / 100
      });
    }

    const order = orderModel.create({
      userId: req.userId,
      addressId,
      payMethod,
      remark,
      items: enrichedItems
    });

    res.json({ code: 200, message: '订单创建成功', data: order });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取订单列表（支持状态筛选、分页）
router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const data = orderModel.findByUserId(req.userId, { status, page: parseInt(page), pageSize: parseInt(pageSize) });
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取订单详情
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const order = orderModel.findById(req.params.id);
    if (!order || String(order.user_id) !== String(req.userId)) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({ code: 200, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 取消订单
router.put('/:id/cancel', authMiddleware, (req, res) => {
  try {
    const result = orderModel.cancel(req.params.id, req.userId);
    if (!result) {
      return res.status(400).json({ code: 400, message: '只能取消待付款订单或订单不存在' });
    }
    res.json({ code: 200, message: '订单已取消', data: result });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;