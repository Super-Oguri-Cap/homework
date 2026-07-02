<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">🛒</div>
        <h1>电商管理系统</h1>
        <p>欢迎回来，请登录您的账号</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="请输入用户名（admin）"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入密码（123456）"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="loading"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
      </form>

      <div class="login-footer">
        <p>默认账号：admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../api/user';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await login(username.value, password.value);
    if (res.code === 200) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/products');
    } else {
      errorMsg.value = res.message || '登录失败';
    }
  } catch (error) {
    errorMsg.value = error.message || '请求失败，请检查网络连接';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #a855f7 60%, #d946ef 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  padding: var(--spacing-lg);
  position: relative;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.login-page::after {
  content: '';
  position: absolute;
  top: 20%;
  right: 20%;
  width: 300px;
  height: 300px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  filter: blur(60px);
  animation: float 6s ease-in-out infinite;
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-3xl);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-2xl), 0 0 60px rgba(99, 102, 241, 0.2);
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.logo {
  font-size: 56px;
  margin-bottom: var(--spacing-md);
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.1s both;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.login-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.5px;
}

.login-header p {
  font-size: 14px;
  color: var(--text-muted);
}

.login-form {
  margin-bottom: var(--spacing-xl);
}

.form-group {
  position: relative;
}

.form-group:focus-within label {
  color: var(--primary);
}

.form-group:focus-within .form-input {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.2px;
  transition: color var(--transition-fast);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 15px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:hover {
  border-color: var(--border-focus);
}

.btn-block {
  width: 100%;
}

.btn-primary {
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.btn-primary:hover::before {
  left: 100%;
}

.error-message {
  background-color: var(--danger-light);
  color: var(--danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 13px;
  text-align: center;
  margin-top: var(--spacing-md);
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.login-footer {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.login-footer p {
  font-size: 12px;
  color: var(--text-muted);
  background-color: var(--bg-hover);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  display: inline-block;
}

.loading {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-xl);
    border-radius: var(--radius-xl);
  }

  .login-header h1 {
    font-size: 24px;
  }

  .logo {
    font-size: 48px;
  }
}
</style>