<template>
  <div class="login-container">
    <h2>用户登录</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>用户名：</label>
        <input v-model="username" placeholder="admin" />
      </div>
      <div>
        <label>密码：</label>
        <input v-model="password" type="password" placeholder="123456" />
      </div>
      <button type="submit">登录</button>
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </form>
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

const handleLogin = async () => {
  try {
    const res = await login(username.value, password.value);
    if (res.code === 200) {
      // 存储 token
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      // 跳转到产品管理
      router.push('/products');
    } else {
      errorMsg.value = res.message || '登录失败';
    }
  } catch (error) {
    errorMsg.value = error.message || '请求失败';
  }
};
</script>

<style scoped>
.login-container { max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; }
.error { color: red; }
</style>