// backend/address.js
const express = require('express');
const router = express.Router();

// 模拟地址数据（按用户ID存储）
const addresses = {
  '1': [
    {
      id: 1,
      receiver: '张三',
      phone: '13800138000',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园路1号创新大厦A座1201室',
      isDefault: true
    },
    {
      id: 2,
      receiver: '张三',
      phone: '13900139000',
      province: '广东省',
      city: '广州市',
      district: '天河区',
      detail: '天河路385号太古汇一座1802室',
      isDefault: false
    },
    {
      id: 3,
      receiver: '李四',
      phone: '13700137000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '建国路88号SOHO现代城C座2506室',
      isDefault: false
    }
  ]
};

// 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权' });
  }
  const parts = token.split('-');
  req.userId = parts[1] || '1';
  if (!addresses[req.userId]) {
    addresses[req.userId] = [];
  }
  next();
};

// 获取地址列表
router.get('/', authMiddleware, (req, res) => {
  const userAddresses = addresses[req.userId] || [];
  res.json({ code: 200, data: userAddresses });
});

// 添加地址
router.post('/', authMiddleware, (req, res) => {
  const { receiver, phone, province, city, district, detail, isDefault } = req.body;
  
  if (!receiver || !phone || !province || !city || !district || !detail) {
    return res.status(400).json({ code: 400, message: '请填写完整的地址信息' });
  }
  
  const newAddress = {
    id: Date.now(),
    receiver,
    phone,
    province,
    city,
    district,
    detail,
    isDefault: isDefault || false
  };
  
  // 如果设为默认，取消其他默认
  if (newAddress.isDefault) {
    addresses[req.userId].forEach(a => a.isDefault = false);
  }
  
  // 如果是第一个地址，自动设为默认
  if (addresses[req.userId].length === 0) {
    newAddress.isDefault = true;
  }
  
  addresses[req.userId].push(newAddress);
  res.json({ code: 200, message: '添加成功', data: newAddress });
});

// 更新地址
router.put('/:id', authMiddleware, (req, res) => {
  const addressId = parseInt(req.params.id);
  const userAddresses = addresses[req.userId];
  const address = userAddresses.find(a => a.id === addressId);
  
  if (!address) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  const { receiver, phone, province, city, district, detail, isDefault } = req.body;
  
  if (isDefault) {
    userAddresses.forEach(a => a.isDefault = false);
  }
  
  Object.assign(address, {
    receiver: receiver || address.receiver,
    phone: phone || address.phone,
    province: province || address.province,
    city: city || address.city,
    district: district || address.district,
    detail: detail || address.detail,
    isDefault: isDefault !== undefined ? isDefault : address.isDefault
  });
  
  res.json({ code: 200, message: '更新成功', data: address });
});

// 删除地址
router.delete('/:id', authMiddleware, (req, res) => {
  const addressId = parseInt(req.params.id);
  const userAddresses = addresses[req.userId];
  const index = userAddresses.findIndex(a => a.id === addressId);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  const deleted = userAddresses.splice(index, 1)[0];
  res.json({ code: 200, message: '删除成功', data: deleted });
});

// 设为默认地址
router.put('/:id/default', authMiddleware, (req, res) => {
  const addressId = parseInt(req.params.id);
  const userAddresses = addresses[req.userId];
  const address = userAddresses.find(a => a.id === addressId);
  
  if (!address) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  userAddresses.forEach(a => a.isDefault = false);
  address.isDefault = true;
  
  res.json({ code: 200, message: '设置成功', data: address });
});

module.exports = router;
