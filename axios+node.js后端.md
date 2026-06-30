# Vue 3 + Axios 全栈学习文档（登录 + 产品管理）

本教程将从零开始，使用 Vite 构建 Vue 3 前端项目，配置 Axios 进行 HTTP 请求，并使用 Node.js 构建一个提供用户登录和产品管理接口的后端服务。最终实现一个具有登录认证和产品增删改查功能的完整应用。

## 目录

1. [环境准备与项目初始化](#1-环境准备与项目初始化)
2. [Node.js 后端开发（user.js + products.js）](#2-nodejs-后端开发userjs--productsjs)
3. [Vue 3 前端集成 Axios](#3-vue-3-前端集成-axios)
4. [实现登录功能并存储 Token](#4-实现登录功能并存储-token)
5. [带 Token 请求产品管理页面](#5-带-token-请求产品管理页面)
6. [提交产品修改（更新产品数据）](#6-提交产品修改更新产品数据)
7. [运行与测试](#7-运行与测试)

## 1. 环境准备与项目初始化

确保已安装 **Node.js** (v16+) 和 **npm**。

### 1.1 创建 Vite 前端项目

```bash
# 使用 npm 创建 vite 项目（选择 vue 模板）
npm create vite@latest vue-axios-demo -- --template vue
cd vue-axios-demo
npm install
```


### 1.2 安装 Axios

```bash
npm install axios
```


***

## 2. Node.js 后端开发（user.js + products.js）

我们将创建一个简单的 Node.js 后端，提供登录接口和产品 CRUD 接口。使用 `express` 和 `cors`。

### 2.1 初始化后端目录

在项目根目录下创建 `backend` 文件夹，并初始化：

```bash
mkdir backend
cd backend
npm init -y
npm install express cors body-parser
```


### 2.2 创建 `user.js`（用户登录接口）

在 `backend` 目录下创建 `user.js`：

```javascript
// backend/user.js
const express = require('express');
const router = express.Router();

// 模拟用户数据（实际开发应查数据库）
const users = [
  { id: 1, username: 'admin', password: '123456' },
  { id: 2, username: 'user', password: 'password' }
];

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // 生成一个简单的 token（实际应使用 jwt）
    const token = `token-${user.id}-${Date.now()}`;
    res.json({ 
      code: 200, 
      message: '登录成功', 
      token, 
      user: { id: user.id, username: user.username } 
    });
  } else {
    res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
});

module.exports = router;
```


### 2.3 创建 `products.js`（产品管理接口）

在 `backend` 目录下创建 `products.js`：

```javascript
// backend/products.js
const express = require('express');
const router = express.Router();

// 模拟产品数据
let products = [
  { id: 1, name: '笔记本电脑', price: 5999, stock: 10 },
  { id: 2, name: '智能手机', price: 3999, stock: 25 },
  { id: 3, name: '无线耳机', price: 499, stock: 50 }
];

// 中间件：验证 token（简单实现）
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ code: 401, message: '未授权' });
  }
  next();
};

// 获取所有产品（需要认证）
router.get('/', authMiddleware, (req, res) => {
  res.json({ code: 200, data: products });
});

// 更新产品（需要认证）
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, stock } = req.body;
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '产品不存在' });
  }
  
  // 更新字段
  if (name) product.name = name;
  if (price) product.price = price;
  if (stock !== undefined) product.stock = stock;
  
  res.json({ code: 200, message: '更新成功', data: product });
});

module.exports = router;
```


### 2.4 创建主服务器文件 `server.js`

整合所有路由并启动服务：

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./user');
const productRoutes = require('./products');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(bodyParser.json());

// 路由挂载
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    code: 200, 
    message: '后端服务运行中', 
    availableRoutes: [
      'POST /api/user/login - 用户登录',
      'GET /api/products - 获取产品列表(需认证)',
      'PUT /api/products/:id - 更新产品(需认证)'
    ] 
  });
});
// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
```


### 2.5 启动后端

在 `backend` 目录下运行：

```bash
node server.js
```


后端将在 `http://localhost:3000` 运行。

***

## 3. Vue 3 前端集成 Axios

### 3.1 在 Vite 项目中配置 Axios

在 `src` 目录下创建 `utils/axios.js` 进行统一配置：

```javascript
// src/utils/axios.js
import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:3000/api', // 后端基础路径
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      // 处理 401 未授权
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // 跳转到登录页
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default request;
```


### 3.2 创建登录和产品管理的 API 模块

在 `src/api` 目录下创建：

* `user.js`：用户相关接口
* `product.js`：产品相关接口

```javascript
// src/api/user.js
import request from '../utils/axios';

export const login = (username, password) => {
  return request.post('/user/login', { username, password });
};
```


```javascript
// src/api/product.js
import request from '../utils/axios';

export const getProducts = () => {
  return request.get('/products');
};

export const updateProduct = (id, data) => {
  return request.put(`/products/${id}`, data);
};
```


***

## 4. 实现登录功能并存储 Token

### 4.1 创建登录页面组件

在 `src/components/Login.vue` 中：

```vue
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
```


### 4.2 配置路由

安装 Vue Router：

```bash
npm install vue-router
```


创建 `src/router/index.js`：

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Products from '../components/Products.vue';

const routes = [
  { path: '/login', component: Login },
  { 
    path: '/products', 
    component: Products,
    meta: { requiresAuth: true } // 需要认证
  },
  { path: '/', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 导航守卫：检查认证
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
```


在 `main.js` 中引入路由和组件：

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
```


修改 `App.vue`：

```vue
<template>
  <router-view />
</template>
```


***

## 5. 带 Token 请求产品管理页面

### 5.1 创建产品管理组件

`src/components/Products.vue`：

```vue
<template>
  <div>
    <h2>产品管理</h2>
    <button @click="logout">退出登录</button>
    <table border="1" cellpadding="8" style="width: 100%; margin-top: 20px;">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>价格</th>
          <th>库存</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.price }}</td>
          <td>{{ product.stock }}</td>
          <td>
            <button @click="editProduct(product)">编辑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 编辑弹窗 -->
    <div v-if="editingProduct" class="modal">
      <h3>编辑产品</h3>
      <div>
        <label>名称：<input v-model="editingProduct.name" /></label>
      </div>
      <div>
        <label>价格：<input v-model.number="editingProduct.price" type="number" /></label>
      </div>
      <div>
        <label>库存：<input v-model.number="editingProduct.stock" type="number" /></label>
      </div>
      <button @click="saveProduct">保存</button>
      <button @click="editingProduct = null">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProducts, updateProduct } from '../api/product';

const router = useRouter();
const products = ref([]);
const editingProduct = ref(null);

// 获取产品列表
const fetchProducts = async () => {
  try {
    const res = await getProducts();
    if (res.code === 200) {
      products.value = res.data;
    }
  } catch (error) {
    alert('获取产品失败：' + (error.message || ''));
  }
};

// 编辑按钮
const editProduct = (product) => {
  editingProduct.value = { ...product }; // 深拷贝避免直接修改原数据
};

// 保存修改
const saveProduct = async () => {
  if (!editingProduct.value) return;
  try {
    const { id, name, price, stock } = editingProduct.value;
    const res = await updateProduct(id, { name, price, stock });
    if (res.code === 200) {
      // 更新本地数据
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = res.data;
      }
      editingProduct.value = null;
      alert('更新成功！');
    } else {
      alert(res.message || '更新失败');
    }
  } catch (error) {
    alert('提交修改失败：' + (error.message || ''));
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.modal {
  position: fixed;
  top: 20%;
  left: 30%;
  background: white;
  padding: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  width: 300px;
}
</style>
```


***

## 6. 提交产品修改（更新产品数据）

在 `Products.vue` 组件中，`saveProduct` 函数通过 `updateProduct` API 发送 PUT 请求到 `/api/products/:id`，请求头中自动携带 Token（由 Axios 拦截器添加）。

后端 `products.js` 中的 `authMiddleware` 会验证 Token 有效性，验证通过后更新产品数据。更新成功后，前端将本地数据同步更新，并提示用户。

### 关键流程：

1. 用户点击“编辑” → 弹窗显示当前产品数据。
2. 用户修改数据后点击“保存”。
3. 调用 `updateProduct(id, data)` → Axios 携带 Token 发起 PUT 请求。
4. 后端验证 Token，更新内存中的 `products` 数组。
5. 前端收到成功响应，更新本地列表并关闭弹窗。

***

## 7. 运行与测试

### 7.1 启动后端（在 backend 目录下）

```bash
node server.js
```


服务运行在 `http://localhost:3000`

### 7.2 启动前端 Vite 项目（在项目根目录）

```bash
npm run dev
```


前端默认运行在 `http://localhost:5173`

### 7.3 测试流程

1. 访问 `http://localhost:5173`，自动跳转到登录页。
2. 使用用户名 `admin`，密码 `123456` 登录。
3. 登录成功后跳转到产品管理页，显示产品列表。
4. 点击“编辑”修改产品信息，点击“保存”提交修改。
5. 刷新页面或再次登录，数据保持更新（内存存储，重启后端会重置）。

***

## 总结

通过本教程，你已掌握：

* 使用 Vite 创建 Vue 3 项目并安装 Axios。
* 使用 Node.js + Express 搭建 RESTful API 后端。
* 配置 Axios 拦截器统一管理 Token 和错误。
* 实现登录认证并将 Token 存储在 localStorage。
* 在组件中调用带认证的 API 获取和修改产品数据。
* 使用 Vue Router 进行路由守卫保护需要登录的页面。

此架构可轻松扩展为真实后端（如连接数据库、使用 JWT 等），是 Vue 3 全栈开发的典型模式。

```

```


