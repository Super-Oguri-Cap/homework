// backend/tests/db.test.js
// 数据库集成测试
const { getDb, initDatabase, closeDatabase } = require('../database/db');
const userModel = require('../models/user');
const productModel = require('../models/product');
const cartModel = require('../models/cart');
const orderModel = require('../models/order');
const addressModel = require('../models/address');
const reviewModel = require('../models/review');

let db;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message} (expected: ${expected}, got: ${actual})`);
  }
}

// ==================== 初始化 ====================
console.log('\n=== 数据库集成测试 ===\n');

async function main() {
try {
db = await initDatabase();
console.log('[测试] 数据库初始化完成\n');

// ==================== 1. 用户模块测试 ====================
console.log('--- 1. 用户模块 ---');

const testUser = userModel.create({
  username: 'test_user_' + Date.now(),
  password: 'test123',
  name: '测试用户',
  email: 'test@test.com'
});

assert(testUser !== null, '创建用户成功');
assertEqual(testUser.username.startsWith('test_user_'), true, '用户名正确');

const foundUser = userModel.findByUsername(testUser.username);
assert(foundUser !== null, '按用户名查找成功');
assertEqual(foundUser.id, testUser.id, '查找到的用户 ID 一致');

const foundById = userModel.findById(testUser.id);
assert(foundById !== null, '按 ID 查找成功');

const updatedUser = userModel.update(testUser.id, { name: '更新后的名称' });
assertEqual(updatedUser.name, '更新后的名称', '更新用户名称成功');

const allUsers = userModel.findAll(1, 5);
assert(allUsers.list.length > 0, '获取用户列表成功');

// ==================== 2. 商品模块测试 ====================
console.log('\n--- 2. 商品模块 ---');

const testProduct = productModel.create({
  name: '测试商品_' + Date.now(),
  price: 99.99,
  description: '这是一个测试商品',
  category: '测试分类',
  stock: 50
});

assert(testProduct !== null, '创建商品成功');
assertEqual(testProduct.price, 99.99, '商品价格正确');

const foundProduct = productModel.findById(testProduct.id);
assert(foundProduct !== null, '按 ID 查找商品成功');

const updatedProduct = productModel.update(testProduct.id, { price: 88.88, stock: 40 });
assertEqual(updatedProduct.price, 88.88, '更新商品价格成功');
assertEqual(updatedProduct.stock, 40, '更新商品库存成功');

const productList = productModel.findAll({ page: 1, pageSize: 5 });
assert(productList.list.length > 0, '获取商品列表成功');
assert(productList.total > 0, '商品总数 > 0');

// 分类筛选
const filtered = productModel.findAll({ category: '测试分类' });
assert(filtered.list.length >= 1, '按分类筛选成功');

// 关键词搜索
const searched = productModel.findAll({ keyword: '测试' });
assert(searched.list.length >= 1, '关键词搜索成功');

// 扣减库存
const decreaseResult = productModel.decreaseStock(testProduct.id, 5);
assert(decreaseResult, '扣减库存成功');
const afterDecrease = productModel.findById(testProduct.id);
assertEqual(afterDecrease.stock, 35, '库存扣减后正确');

// 删除测试商品
productModel.delete(testProduct.id);
assert(productModel.findById(testProduct.id) === undefined, '删除商品成功');

// ==================== 3. 地址模块测试 ====================
console.log('\n--- 3. 地址模块 ---');

const testAddress = addressModel.create(1, {
  receiver: '测试收货人',
  phone: '13800138001',
  province: '浙江省',
  city: '杭州市',
  district: '西湖区',
  detail: '测试路1号',
  isDefault: false
});

assert(testAddress !== null, '创建地址成功');
assertEqual(testAddress.receiver, '测试收货人', '收货人正确');

const userAddresses = addressModel.findByUserId(1);
assert(userAddresses.length > 0, '获取用户地址列表成功');

const updatedAddress = addressModel.update(testAddress.id, 1, { receiver: '更新收货人' });
assertEqual(updatedAddress.receiver, '更新收货人', '更新地址成功');

const setDefaultResult = addressModel.setDefault(testAddress.id, 1);
assertEqual(setDefaultResult.isDefault, 1, '设为默认地址成功');

// 清理
addressModel.delete(testAddress.id, 1);
assert(addressModel.findById(testAddress.id) === undefined, '删除地址成功');

// ==================== 4. 购物车模块测试 ====================
console.log('\n--- 4. 购物车模块 ---');

const productForCart = productModel.create({
  name: '购物车测试商品',
  price: 50,
  stock: 100
});

const cartData = cartModel.addItem(1, productForCart.id, 3);
assert(cartData.length >= 1, '添加购物车成功');
assert(cartData.find(i => i.productId === productForCart.id).quantity === 3, '购物车数量正确');

const cartAfterUpdate = cartModel.updateQuantity(cartData[0].id, 5, 1);
const updated = cartAfterUpdate.find(i => i.productId === productForCart.id);
assert(updated && updated.quantity === 5, '更新购物车数量成功');

const cartAfterToggle = cartModel.toggleSelect(cartData[0].id, 1);
assert(cartAfterToggle.length > 0, '切换选中状态成功');

const cartAfterSelectAll = cartModel.selectAll(1, false);
const allUnselected = cartAfterSelectAll.every(i => i.selected === 0);
assert(allUnselected, '全选取消成功');

cartModel.selectAll(1, true);

const cartAfterRemove = cartModel.removeItem(cartData[0].id, 1);
const removed = cartAfterRemove.find(i => i.productId === productForCart.id);
assert(removed === undefined, '删除购物车项成功');

// 清理
productModel.delete(productForCart.id);

// ==================== 5. 订单模块测试 ====================
console.log('\n--- 5. 订单模块 ---');

// 创建测试商品
const orderProduct = productModel.create({
  name: '订单测试商品',
  price: 100,
  stock: 20
});

// 使用已有地址（id=1）创建订单
const order = orderModel.create({
  userId: 1,
  addressId: 1,
  payMethod: 'wechat',
  remark: '测试订单',
  items: [{
    productId: orderProduct.id,
    productName: orderProduct.name,
    productPrice: orderProduct.price,
    quantity: 2,
    totalPrice: 200
  }]
});

assert(order !== null, '创建订单成功');
assertEqual(order.status, 'pending', '订单状态为 pending');
assert(order.orderNo.startsWith('ORD'), '订单编号格式正确');
assert(order.items.length === 1, '订单包含 1 个明细');
assertEqual(order.items[0].totalPrice, 200, '订单明细金额正确');

// 检查库存扣减
const productAfterOrder = productModel.findById(orderProduct.id);
assertEqual(productAfterOrder.stock, 18, '下单后库存扣减正确');

const orderDetail = orderModel.findById(order.id);
assert(orderDetail !== null, '获取订单详情成功');

const userOrders = orderModel.findByUserId(1);
assert(userOrders.list.length > 0, '获取用户订单列表成功');

// 取消订单
const cancelledOrder = orderModel.cancel(order.id, 1);
assert(cancelledOrder !== null, '取消订单成功');
assertEqual(cancelledOrder.status, 'cancelled', '订单状态已变为 cancelled');

// 清理（注意：orderProduct 被订单引用，无法直接删除）
// productModel.delete(orderProduct.id);

// ==================== 6. 评价模块测试 ====================
console.log('\n--- 6. 评价模块 ---');

const reviewProduct = productModel.create({
  name: '评价测试商品',
  price: 10,
  stock: 10
});

// 创建订单用于评价
const reviewOrder = orderModel.create({
  userId: 1,
  addressId: 1,
  items: [{
    productId: reviewProduct.id,
    productName: reviewProduct.name,
    productPrice: reviewProduct.price,
    quantity: 1,
    totalPrice: 10
  }]
});

const review = reviewModel.create({
  userId: 1,
  productId: reviewProduct.id,
  orderId: reviewOrder.id,
  rating: 5,
  content: '非常好的商品！'
});

assert(review !== null, '创建评价成功');
assertEqual(review.rating, 5, '评价评分正确');
assertEqual(review.content, '非常好的商品！', '评价内容正确');

const productReviews = reviewModel.findByProductId(reviewProduct.id);
assert(productReviews.list.length >= 1, '获取商品评价列表成功');

const stats = reviewModel.getProductRatingStats(reviewProduct.id);
assert(stats !== null, '获取评分统计成功');
assertEqual(stats.star5, 1, '5星评价数为 1');

// 清理（注意：reviewProduct 被订单引用，无法直接删除，测试数据保留在数据库中）

// ==================== 结果汇总 ====================
console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);
console.log('');

// 关闭数据库
closeDatabase();

if (failed > 0) {
  process.exit(1);
}
} catch (err) {
  console.error('[测试异常]', err);
  process.exit(1);
}
}

main();
