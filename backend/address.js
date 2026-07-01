// backend/address.js
// 地址路由 — 基于 SQLite models
const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/auth');
const addressModel = require('./models/address');

// 获取地址列表
router.get('/', authMiddleware, (req, res) => {
  try {
    const data = addressModel.findByUserId(req.userId);
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 添加地址
router.post('/', authMiddleware, (req, res) => {
  try {
    const { receiver, phone, province, city, district, detail, isDefault } = req.body;

    if (!receiver || !phone || !province || !city || !district || !detail) {
      return res.status(400).json({ code: 400, message: '请填写完整的地址信息' });
    }

    const address = addressModel.create(req.userId, {
      receiver, phone, province, city, district, detail,
      isDefault: isDefault || false
    });

    res.json({ code: 200, message: '添加成功', data: address });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 更新地址
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { receiver, phone, province, city, district, detail, isDefault } = req.body;
    const fields = { receiver, phone, province, city, district, detail, is_default: isDefault };
    // 过滤掉未传的字段
    for (const key of Object.keys(fields)) {
      if (fields[key] === undefined) delete fields[key];
    }
    const address = addressModel.update(req.params.id, req.userId, fields);
    res.json({ code: 200, message: '更新成功', data: address });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 删除地址
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = addressModel.delete(req.params.id, req.userId);
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: '地址不存在' });
    }
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 设为默认地址
router.put('/:id/default', authMiddleware, (req, res) => {
  try {
    const address = addressModel.setDefault(req.params.id, req.userId);
    res.json({ code: 200, message: '设置成功', data: address });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;