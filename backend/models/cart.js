// backend/models/cart.js
// 购物车数据访问层
const { getDb } = require('../database/db');

const cartModel = {
  /**
   * 获取用户购物车（含商品信息）
   */
  findByUserId(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, p.name AS productName, p.price AS productPrice, p.image AS productImage, p.stock AS productStock, p.status AS productStatus
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);
  },

  /**
   * 添加商品到购物车（已存在则增加数量）
   */
  addItem(userId, productId, quantity = 1) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const existing = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).get(userId, productId);

    if (existing) {
      db.prepare(
        'UPDATE cart_items SET quantity = quantity + ?, updated_at = ? WHERE id = ?'
      ).run(quantity, now, existing.id);
    } else {
      db.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity, selected, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
      ).run(userId, productId, quantity, now, now);
    }

    return this.findByUserId(userId);
  },

  /**
   * 更新购物车项数量
   */
  updateQuantity(id, quantity, userId) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (quantity <= 0) {
      return this.removeItem(id, userId);
    }

    db.prepare(
      'UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(quantity, now, id, userId);

    return this.findByUserId(userId);
  },

  /**
   * 切换选中状态
   */
  toggleSelect(id, userId) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(
      'UPDATE cart_items SET selected = CASE WHEN selected = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(now, id, userId);
    return this.findByUserId(userId);
  },

  /**
   * 全选/取消全选
   */
  selectAll(userId, selected) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(
      'UPDATE cart_items SET selected = ?, updated_at = ? WHERE user_id = ?'
    ).run(selected ? 1 : 0, now, userId);
    return this.findByUserId(userId);
  },

  /**
   * 删除购物车项
   */
  removeItem(id, userId) {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId);
    return this.findByUserId(userId);
  },

  /**
   * 清空已选中项（下单后）
   */
  clearSelected(userId) {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND selected = 1').run(userId);
    return this.findByUserId(userId);
  },

  /**
   * 获取用户已选中的购物车项
   */
  getSelectedItems(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, p.name AS productName, p.price AS productPrice, p.stock AS productStock
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.selected = 1 AND p.status = 1
    `).all(userId);
  },
};

module.exports = cartModel;
