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
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    return '/login';
  }
  // 不返回任何值（返回 undefined）等同于放行
});

export default router;