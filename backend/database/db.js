// backend/database/db.js
// SQLite 数据库连接模块（单例模式）
// 使用 sql.js（纯 JS 实现，无需原生编译）
const path = require('path');
const fs = require('fs');
const { createSchema } = require('./schema');
const { seedData } = require('./seed');

const DB_PATH = path.join(__dirname, 'ecommerce.db');

let db = null;
let _ready = false;
let SQL = null;

// ============================================
// sql.js 兼容层：将 sql.js API 映射为
// better-sqlite3 风格的同步 API
// ============================================

// snake_case → camelCase 转换
function _toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function _transformRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const result = {};
  for (const key of Object.keys(row)) {
    result[_toCamel(key)] = row[key];
  }
  return result;
}

class StatementWrapper {
  constructor(stmt) {
    this._stmt = stmt;
  }

  run(...params) {
    if (params.length > 0) this._stmt.bind(params);
    this._stmt.step();
    this._stmt.reset();
    const lastInsertRowid = this._getLastInsertRowid();
    return { changes: db._raw.getRowsModified(), lastInsertRowid };
  }

  get(...params) {
    if (params.length > 0) this._stmt.bind(params);
    if (this._stmt.step()) {
      const row = this._stmt.getAsObject();
      this._stmt.reset();
      return _transformRow(row);
    }
    this._stmt.reset();
    return undefined;
  }

  all(...params) {
    if (params.length > 0) this._stmt.bind(params);
    const results = [];
    while (this._stmt.step()) {
      results.push(_transformRow(this._stmt.getAsObject()));
    }
    this._stmt.reset();
    return results;
  }

  _getLastInsertRowid() {
    try {
      const result = db._raw.exec("SELECT last_insert_rowid()");
      if (result && result[0] && result[0].values && result[0].values[0]) {
        return result[0].values[0][0];
      }
    } catch (_) { /* ignore */ }
    return 0;
  }
}

class DbWrapper {
  constructor(rawDb) {
    this._raw = rawDb;
  }

  prepare(sql) {
    const stmt = this._raw.prepare(sql);
    return new StatementWrapper(stmt);
  }

  exec(sql) {
    return this._raw.exec(sql);
  }

  pragma(str) {
    this._raw.run(`PRAGMA ${str}`);
  }

  transaction(fn) {
    return (...args) => {
      this._raw.run("BEGIN TRANSACTION");
      try {
        const result = fn(...args);
        this._raw.run("COMMIT");
        return result;
      } catch (e) {
        this._raw.run("ROLLBACK");
        throw e;
      }
    };
  }
}

// ============================================
// 公共 API
// ============================================

function getDb() {
  if (!_ready) {
    throw new Error('[数据库] 尚未初始化，请先调用 initDatabase()');
  }
  return db;
}

async function initDatabase() {
  // 动态加载 sql.js（ESM 模块需要异步导入）
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();

  // 读取已有的数据库文件
  let buffer;
  try {
    buffer = fs.readFileSync(DB_PATH);
    console.log('[数据库] 读取已有数据库文件:', DB_PATH);
  } catch (e) {
    console.log('[数据库] 未找到数据库文件，将创建新库');
  }

  const rawDb = new SQL.Database(buffer || undefined);
  rawDb.run("PRAGMA foreign_keys = ON");

  db = new DbWrapper(rawDb);
  _ready = true;

  // 初始化表结构
  createSchema(db);
  // 填充种子数据
  seedData(db);

  // 保存到文件
  _saveDatabase();

  console.log('[数据库] SQLite 初始化完成:', DB_PATH);
  return db;
}

function _saveDatabase() {
  try {
    const data = db._raw.export();
    const buf = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buf);
  } catch (e) {
    console.error('[数据库] 保存文件失败:', e.message);
  }
}

function closeDatabase() {
  if (db) {
    _saveDatabase();
    db._raw.close();
    db = null;
    _ready = false;
    console.log('[数据库] 连接已关闭');
  }
}

module.exports = { getDb, initDatabase, closeDatabase };