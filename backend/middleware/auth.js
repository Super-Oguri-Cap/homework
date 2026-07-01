// backend/middleware/auth.js
// 统一认证中间件

/**
 * 从请求头中提取用户 ID
 * 格式: Authorization: Bearer token-{userId}-{timestamp}
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权，请先登录' });
  }

  const parts = token.split('-');
  req.userId = parts[1] || '1';
  next();
}

module.exports = authMiddleware;