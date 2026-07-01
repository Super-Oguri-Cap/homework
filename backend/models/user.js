// backend/models/user.js
// 用户数据访问层
const { getDb } = require('../database/db');

const userModel = {
  /**
   * 根据用户名查找用户
   */
  findByUsername(username) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  /**
   * 根据 ID 查找用户
   */
  findById(id) {
    const db = getDb();
    return db.prepare('SELECT id, username, name, email, avatar, role, created_at, updated_at FROM users WHERE id = ?').get(id);
  },

  /**
   * 获取用户列表（分页）
   */
  findAll(page = 1, pageSize = 10) {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const total = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
    const list = db.prepare(
      'SELECT id, username, name, email, avatar, role, created_at, updated_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?'
    ).all(pageSize, offset);
    return { list, total, page, pageSize };
  },

  /**
   * 创建用户
   */
  create({ username, password, name, email, role = 'user' }) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db.prepare(
      'INSERT INTO users (username, password, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(username, password, name, email, role, now, now);
    return this.findById(result.lastInsertRowid);
  },

  /**
   * 更新用户
   */
  update(id, fields) {
    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const allowed = ['name', 'email', 'avatar', 'role'];
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
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },
};

module.exports = userModel;
