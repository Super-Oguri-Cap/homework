// backend/models/order.js
// 订单数据访问层
const { getDb } = require('../database/db');

/**
 * 生成订单编号
 */
function generateOrderNo() {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
}

const orderModel = {
  /**
   * 创建订单（事务处理：扣库存 + 清空购物车选中项）
   */
  create({ userId, addressId, payMethod = 'wechat', remark = '', items }) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderNo = generateOrderNo();

    // 计算金额
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.productPrice * item.quantity;
    }

    const freight = totalAmount >= 99 ? 0 : 10;
    const payAmount = Math.round((totalAmount + freight) * 100) / 100;
    totalAmount = Math.round(totalAmount * 100) / 100;

    // 事务开始
    const createOrder = db.transaction(() => {
      // 1. 创建订单
      const orderResult = db.prepare(`
        INSERT INTO orders (order_no, user_id, total_amount, pay_amount, freight, status, pay_method, address_id, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `).run(orderNo, userId, totalAmount, payAmount, freight, payMethod, addressId, remark, now, now);

      const orderId = orderResult.lastInsertRowid;

      // 2. 插入订单明细
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(orderId, item.productId, item.productName, item.productPrice, item.quantity, item.totalPrice);
        // 3. 扣减库存
        db.prepare(
          'UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = ? WHERE id = ? AND stock >= ?'
        ).run(item.quantity, item.quantity, now, item.productId, item.quantity);
      }

      // 4. 清空购物车选中项
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND selected = 1').run(userId);

      return orderId;
    });

    const orderId = createOrder();
    return this.findById(orderId);
  },

  /**
   * 获取订单列表（支持状态筛选、分页）
   */
  findByUserId(userId, { status, page = 1, pageSize = 10 } = {}) {
    const db = getDb();
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM orders ${where}`).get(...params).cnt;
    const list = db.prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  },

  /**
   * 获取订单详情（含订单明细）
   */
  findById(orderId) {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return null;

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    order.items = items;
    return order;
  },

  /**
   * 根据订单编号查找
   */
  findByOrderNo(orderNo) {
    const db = getDb();
    return db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo);
  },

  /**
   * 取消订单
   */
  cancel(orderId, userId) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db.prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND user_id = ? AND status = 'pending'"
    ).run(now, orderId, userId);
    return result.changes > 0 ? this.findById(orderId) : null;
  },

  /**
   * 更新订单状态
   */
  updateStatus(orderId, status, extraFields = {}) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const sets = ['status = ?', 'updated_at = ?'];
    const values = [status, now];

    if (status === 'paid') {
      sets.push('paid_at = ?');
      values.push(now);
    } else if (status === 'shipped') {
      sets.push('shipped_at = ?');
      values.push(now);
    } else if (status === 'completed') {
      sets.push('completed_at = ?');
      values.push(now);
    }

    values.push(orderId);
    db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(orderId);
  },

  /**
   * 获取所有订单（管理端）
   */
  findAll({ status, page = 1, pageSize = 10 } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM orders ${where}`).get(...params).cnt;
    const list = db.prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  },
};

module.exports = orderModel;
