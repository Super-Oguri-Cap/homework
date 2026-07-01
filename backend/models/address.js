// backend/models/address.js
// 收货地址数据访问层
const { getDb } = require('../database/db');

const addressModel = {
  /**
   * 获取用户所有地址
   */
  findByUserId(userId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC'
    ).all(userId);
  },

  /**
   * 根据 ID 获取地址
   */
  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  },

  /**
   * 添加地址
   */
  create(userId, { receiver, phone, province, city, district, detail, isDefault = false }) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 检查是否第一个地址（自动设为默认）
    const count = db.prepare('SELECT COUNT(*) AS cnt FROM addresses WHERE user_id = ?').get(userId).cnt;
    const finalDefault = count === 0 ? 1 : (isDefault ? 1 : 0);

    const addAddress = db.transaction(() => {
      // 如果设为默认，先取消其他默认
      if (finalDefault) {
        db.prepare('UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?').run(now, userId);
      }

      const result = db.prepare(`
        INSERT INTO addresses (user_id, receiver, phone, province, city, district, detail, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, receiver, phone, province, city, district, detail, finalDefault, now, now);

      return result.lastInsertRowid;
    });

    const id = addAddress();
    return this.findById(id);
  },

  /**
   * 更新地址
   */
  update(id, userId, fields) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const allowed = ['receiver', 'phone', 'province', 'city', 'district', 'detail', 'is_default'];

    const updateAddress = db.transaction(() => {
      // 如果设为默认，先取消其他默认
      if (fields.is_default) {
        db.prepare('UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?').run(now, userId);
      }

      const sets = [];
      const values = [];
      for (const key of allowed) {
        if (fields[key] !== undefined) {
          sets.push(`${key} = ?`);
          values.push(fields[key]);
        }
      }
      if (sets.length === 0) return;

      sets.push('updated_at = ?');
      values.push(now);
      values.push(id);
      values.push(userId);

      db.prepare(`UPDATE addresses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    });

    updateAddress();
    return this.findById(id);
  },

  /**
   * 删除地址
   */
  delete(id, userId) {
    const db = getDb();
    return db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, userId);
  },

  /**
   * 设为默认地址
   */
  setDefault(id, userId) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.transaction(() => {
      db.prepare('UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?').run(now, userId);
      db.prepare('UPDATE addresses SET is_default = 1, updated_at = ? WHERE id = ? AND user_id = ?').run(now, id, userId);
    })();

    return this.findById(id);
  },
};

module.exports = addressModel;
