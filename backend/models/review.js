// backend/models/review.js
// 商品评价数据访问层
const { getDb } = require('../database/db');

const reviewModel = {
  /**
   * 获取商品的评价列表
   */
  findByProductId(productId, { page = 1, pageSize = 10 } = {}) {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) AS cnt FROM reviews WHERE product_id = ?').get(productId).cnt;
    const list = db.prepare(`
      SELECT r.*, u.username, u.name AS userName, u.avatar AS userAvatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(productId, pageSize, offset);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  },

  /**
   * 获取用户的评价列表
   */
  findByUserId(userId, { page = 1, pageSize = 10 } = {}) {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) AS cnt FROM reviews WHERE user_id = ?').get(userId).cnt;
    const list = db.prepare(`
      SELECT r.*, p.name AS productName, p.image AS productImage
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  },

  /**
   * 创建评价
   */
  create({ userId, productId, orderId, rating, content, images }) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = db.prepare(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, content, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, productId, orderId, rating, content || null, images ? JSON.stringify(images) : null, now, now);

    // 更新商品评分
    this._updateProductRating(productId);

    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  },

  /**
   * 获取商品评分统计
   */
  getProductRatingStats(productId) {
    const db = getDb();
    return db.prepare(`
      SELECT
        COUNT(*) AS totalCount,
        ROUND(AVG(rating), 1) AS avgRating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star1
      FROM reviews
      WHERE product_id = ?
    `).get(productId);
  },

  /**
   * 更新商品平均评分（内部方法）
   */
  _updateProductRating(productId) {
    const db = getDb();
    const stats = db.prepare('SELECT ROUND(AVG(rating), 1) AS avgRating FROM reviews WHERE product_id = ?').get(productId);
    if (stats && stats.avgRating) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      db.prepare('UPDATE products SET rating = ?, updated_at = ? WHERE id = ?').run(stats.avgRating, now, productId);
    }
  },
};

module.exports = reviewModel;
