// backend/models/product.js
// 商品数据访问层
const { getDb } = require('../database/db');

const productModel = {
  /**
   * 获取商品列表（支持筛选、排序、分页）
   */
  findAll({ page = 1, pageSize = 10, category, keyword, status, sort = 'id' } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (keyword) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 排序映射（防止 SQL 注入）
    const sortMap = {
      id: 'id DESC',
      price: 'price ASC',
      price_desc: 'price DESC',
      sales: 'sales DESC',
      rating: 'rating DESC',
    };
    const orderBy = sortMap[sort] || 'id DESC';

    const offset = (page - 1) * pageSize;
    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM products ${where}`).get(...params).cnt;
    const list = db.prepare(
      `SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  },

  /**
   * 根据 ID 获取商品
   */
  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  /**
   * 创建商品
   */
  create({ name, price, description, category, image, stock = 0 }) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db.prepare(`
      INSERT INTO products (name, price, description, category, image, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, price, description || null, category || null, image || null, stock, now, now);
    return this.findById(result.lastInsertRowid);
  },

  /**
   * 更新商品
   */
  update(id, fields) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const allowed = ['name', 'price', 'description', 'category', 'image', 'stock', 'rating', 'sales', 'status'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length === 0) return this.findById(id);
    sets.push('updated_at = ?');
    values.push(now);
    values.push(id);
    db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  /**
   * 扣减库存（下单时使用）
   */
  decreaseStock(id, quantity) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db.prepare(`
      UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = ?
      WHERE id = ? AND stock >= ?
    `).run(quantity, quantity, now, id, quantity);
    return result.changes > 0;
  },

  /**
   * 删除商品
   */
  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM products WHERE id = ?').run(id);
  },

  /**
   * 获取所有分类
   */
  getCategories() {
    const db = getDb();
    return db.prepare('SELECT DISTINCT category FROM products WHERE status = 1 ORDER BY category').all();
  },
};

module.exports = productModel;
