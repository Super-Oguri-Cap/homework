// backend/order.js
const express = require('express');
const router = express.Router();

// 模拟产品数据
const products = [
  { id: 1, name: '笔记本电脑', price: 5999, stock: 10 },
  { id: 2, name: '智能手机', price: 3999, stock: 25 },
  { id: 3, name: '无线耳机', price: 499, stock: 50 }
];

// 模拟订单数据（按用户ID存储）
const orders = {};

// 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权' });
  }
  const parts = token.split('-');
  req.userId = parts[1] || '1';
  if (!orders[req.userId]) {
    orders[req.userId] = [];
  }
  next();
};

// 生成订单编号
const generateOrderNo = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
};

// 创建订单
router.post('/', authMiddleware, (req, res) => {
  const { addressId, payMethod = 'wechat', remark = '', items } = req.body;
  
  if (!addressId) {
    return res.status(400).json({ code: 400, message: '请选择收货地址' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ code: 400, message: '订单商品不能为空' });
  }
  
  // 计算金额
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`商品 ID ${item.productId} 不存在`);
    }
    const totalPrice = product.price * item.quantity;
    totalAmount += totalPrice;
    return {
      id: Date.now() + Math.random(),
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      quantity: item.quantity,
      totalPrice
    };
  });
  
  const freight = totalAmount >= 99 ? 0 : 10; // 满99包邮
  const discount = 0; // 优惠（暂不支持优惠券）
  const payAmount = totalAmount + freight - discount;
  
  const newOrder = {
    id: Date.now(),
    orderNo: generateOrderNo(),
    userId: req.userId,
    totalAmount: Math.round(totalAmount * 100) / 100,
    freight,
    discount,
    payAmount: Math.round(payAmount * 100) / 100,
    status: 'pending',
    payMethod,
    addressId,
    remark,
    items: orderItems,
    paidAt: null,
    shippedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  orders[req.userId].push(newOrder);
  
  res.json({
    code: 200,
    message: '订单创建成功',
    data: newOrder
  });
});

// 获取订单列表（支持状态筛选、分页）
router.get('/', authMiddleware, (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  let userOrders = orders[req.userId] || [];
  
  if (status) {
    userOrders = userOrders.filter(o => o.status === status);
  }
  
  // 按创建时间倒序
  userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const total = userOrders.length;
  const start = (page - 1) * pageSize;
  const pagedOrders = userOrders.slice(start, start + parseInt(pageSize));
  
  res.json({
    code: 200,
    data: {
      list: pagedOrders,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// 获取订单详情
router.get('/:id', authMiddleware, (req, res) => {
  const userOrders = orders[req.userId] || [];
  const order = userOrders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  
  res.json({ code: 200, data: order });
});

// 取消订单
router.put('/:id/cancel', authMiddleware, (req, res) => {
  const userOrders = orders[req.userId] || [];
  const order = userOrders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  
  if (order.status !== 'pending') {
    return res.status(400).json({ code: 400, message: '只能取消待付款订单' });
  }
  
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  
  res.json({ code: 200, message: '订单已取消', data: order });
});

module.exports = router;
