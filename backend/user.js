// backend/user.js
// 用户路由 — 基于 SQLite models
const express = require('express');
const router = express.Router();
const userModel = require('./models/user');

// 登录接口
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = userModel.findByUsername(username);

    if (user && user.password === password) {
      const token = `token-${user.id}-${Date.now()}`;
      res.json({
        code: 200,
        message: '登录成功',
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role }
      });
    } else {
      res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 注册接口
router.post('/register', (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码必填' });
    }

    const existing = userModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    const user = userModel.create({ username, password, name: name || username, email });
    res.json({ code: 200, message: '注册成功', data: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;