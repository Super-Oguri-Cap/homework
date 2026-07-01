// backend/database/seed.js
// 数据库种子数据填充

/**
 * 填充初始数据（仅当表为空时）
 * @param {import('better-sqlite3').Database} db
 */
function seedData(db) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // --- 用户 ---
  const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, email, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const users = [
      ['admin', '123456', '管理员', 'admin@shop.com', 'admin', now, now],
      ['user', 'password', '普通用户', 'user@shop.com', 'user', now, now],
    ];
    for (const u of users) {
      insertUser.run(...u);
    }
    console.log('[种子数据] 已插入 2 个用户');
  }

  // --- 商品 ---
  const productCount = db.prepare('SELECT COUNT(*) AS cnt FROM products').get().cnt;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, price, description, category, image, stock, rating, sales, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      ['笔记本电脑', 5999, '高性能笔记本电脑，适合办公和娱乐', '电子产品',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=laptop+computer+on+white+background%2C+product+photography&image_size=square_hd',
        10, 4.8, 156, 1, now, now],
      ['智能手机', 3999, '最新款智能手机，拍照效果出色', '电子产品',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=smartphone+on+white+background%2C+product+photography&image_size=square_hd',
        25, 4.5, 320, 1, now, now],
      ['无线耳机', 499, '降噪无线耳机，续航持久', '电子产品',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=wireless+earbuds+on+white+background%2C+product+photography&image_size=square_hd',
        50, 4.2, 89, 1, now, now],
      ['运动跑鞋', 899, '轻量透气运动跑鞋，适合长跑', '运动户外',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=running+shoes+on+white+background%2C+product+photography&image_size=square_hd',
        30, 4.6, 210, 1, now, now],
      ['机械键盘', 349, '青轴机械键盘，打字游戏皆宜', '电子产品',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=mechanical+keyboard+on+white+background%2C+product+photography&image_size=square_hd',
        60, 4.3, 178, 1, now, now],
      ['保温杯', 129, '316不锈钢保温杯，12小时保温', '生活用品',
        'https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=thermos+cup+on+white+background%2C+product+photography&image_size=square_hd',
        100, 4.7, 450, 1, now, now],
    ];
    for (const p of products) {
      insertProduct.run(...p);
    }
    console.log('[种子数据] 已插入 6 个商品');
  }

  // --- 地址 ---
  const addressCount = db.prepare('SELECT COUNT(*) AS cnt FROM addresses').get().cnt;
  if (addressCount === 0) {
    const insertAddress = db.prepare(`
      INSERT INTO addresses (user_id, receiver, phone, province, city, district, detail, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const addresses = [
      [1, '张三', '13800138000', '广东省', '深圳市', '南山区', '科技园路1号创新大厦A座1201室', 1, now, now],
      [1, '张三', '13900139000', '广东省', '广州市', '天河区', '天河路385号太古汇一座1802室', 0, now, now],
      [1, '李四', '13700137000', '北京市', '北京市', '朝阳区', '建国路88号SOHO现代城C座2506室', 0, now, now],
    ];
    for (const a of addresses) {
      insertAddress.run(...a);
    }
    console.log('[种子数据] 已插入 3 个地址');
  }
}

module.exports = { seedData };
