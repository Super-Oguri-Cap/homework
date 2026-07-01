// backend/user.js
const express = require('express');
const router = express.Router();

// 模拟用户数据（实际开发应查数据库）
const users = [
  { id: 1, username: 'admin', password: '123456' },
  { id: 2, username: 'user', password: 'password' }
];

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // 生成一个简单的 token（实际应使用 jwt）
    const token = `token-${user.id}-${Date.now()}`;
    res.json({ 
      code: 200, 
      message: '登录成功', 
      token, 
      user: { id: user.id, username: user.username } 
    });
  } else {
    res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
});

module.exports = router;