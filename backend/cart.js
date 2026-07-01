// backend/cart.js
const express = require('express');
const router = express.Router();

// 模拟产品数据（与 products.js 保持一致）
const products = [
  { id: 1, name: '笔记本电脑', price: 5999, stock: 10, image: 'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=laptop+computer+on+white+background%2C+product+photography&image_size=square_hd' },
  { id: 2, name: '智能手机', price: 3999, stock: 25, image: 'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=smartphone+on+white+background%2C+product+photography&image_size=square_hd' },
  { id: 3, name: '无线耳机', price: 499, stock: 50, image: 'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=wireless+earbuds+on+white+background%2C+product+photography&image_size=square_hd' }
];

// 模拟购物车数据（按用户ID存储）
const carts = {};

// 认证中间件（提取用户ID）
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权' });
  }
  const parts = token.split('-');
  req.userId = parts[1] || '1'; // token-{id}-{timestamp}
  if (!carts[req.userId]) {
    carts[req.userId] = [];
  }
  next();
};

// 获取购物车列表
router.get('/', authMiddleware, (req, res) => {
  const userCart = carts[req.userId];
  // 丰富产品信息
  const cartWithProducts = userCart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      productName: product?.name || '未知商品',
      productPrice: product?.price || 0,
      productImage: product?.image || ''
    };
  });
  res.json({ code: 200, data: cartWithProducts });
});

// 添加商品到购物车
router.post('/', authMiddleware, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  const userCart = carts[req.userId];
  const existing = userCart.find(item => item.productId === productId);
  
  if (existing) {
    existing.quantity += quantity;
    existing.updatedAt = new Date().toISOString();
  } else {
    userCart.push({
      id: Date.now(),
      productId,
      quantity,
      selected: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  res.json({ code: 200, message: '添加成功', data: userCart });
});

// 更新购物车商品数量
router.put('/:id', authMiddleware, (req, res) => {
  const { quantity } = req.body;
  const userCart = carts[req.userId];
  const item = userCart.find(i => i.id === parseInt(req.params.id));
  
  if (!item) {
    return res.status(404).json({ code: 404, message: '购物车项不存在' });
  }
  
  if (quantity <= 0) {
    const index = userCart.indexOf(item);
    userCart.splice(index, 1);
  } else {
    item.quantity = quantity;
    item.updatedAt = new Date().toISOString();
  }
  
  res.json({ code: 200, message: '更新成功', data: userCart });
});

// 切换选中状态
router.put('/:id/select', authMiddleware, (req, res) => {
  const userCart = carts[req.userId];
  const item = userCart.find(i => i.id === parseInt(req.params.id));
  
  if (!item) {
    return res.status(404).json({ code: 404, message: '购物车项不存在' });
  }
  
  item.selected = !item.selected;
  item.updatedAt = new Date().toISOString();
  
  res.json({ code: 200, message: '切换成功', data: userCart });
});

// 全选/取消全选
router.put('/select/all', authMiddleware, (req, res) => {
  const { selected } = req.body;
  const userCart = carts[req.userId];
  userCart.forEach(item => {
    item.selected = selected;
    item.updatedAt = new Date().toISOString();
  });
  
  res.json({ code: 200, message: '操作成功', data: userCart });
});

// 删除购物车商品
router.delete('/:id', authMiddleware, (req, res) => {
  const userCart = carts[req.userId];
  const index = userCart.findIndex(i => i.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '购物车项不存在' });
  }
  
  userCart.splice(index, 1);
  res.json({ code: 200, message: '删除成功', data: userCart });
});

// 清空已选中的购物车商品（下单后调用）
router.delete('/clear/selected', authMiddleware, (req, res) => {
  carts[req.userId] = carts[req.userId].filter(item => !item.selected);
  res.json({ code: 200, message: '清空成功', data: carts[req.userId] });
});

module.exports = router;
