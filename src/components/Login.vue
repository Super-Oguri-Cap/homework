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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  padding: var(--spacing-lg);
}

.login-container {
  background-color: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.login-header p {
  font-size: 14px;
  color: var(--text-muted);
}

.login-form {
  margin-bottom: var(--spacing-lg);
}

.btn-block {
  width: 100%;
}

.error-message {
  background-color: var(--danger-light);
  color: var(--danger);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 13px;
  text-align: center;
  margin-top: var(--spacing-md);
}

.login-footer {
  text-align: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

.login-footer p {
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-xl);
  }

  .login-header h1 {
    font-size: 20px;
  }
}
</style>