// backend/database/db.js
// SQLite 数据库连接模块（单例模式）
const Database = require('better-sqlite3');
const path = require('path');
const { createSchema } = require('./schema');
const { seedData } = require('./seed');

const DB_PATH = path.join(__dirname, 'ecommerce.db');

let db = null;

/**
 * 获取数据库实例（单例）
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // 启用 WAL 模式提升并发性能
    db.pragma('journal_mode = WAL');
    // 启用外键约束
    db.pragma('foreign_keys = ON');
    // 设置 busy timeout（毫秒），避免写锁冲突
    db.pragma('busy_timeout = 5000');
    // 初始化表结构
    createSchema(db);
  }
  return db;
}

/**
 * 初始化数据库（创建表 + 填充种子数据）
 */
function initDatabase() {
  const db = getDb();
  seedData(db);
  console.log('[数据库] SQLite 初始化完成:', DB_PATH);
  return db;
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[数据库] 连接已关闭');
  }
}

module.exports = { getDb, initDatabase, closeDatabase };
