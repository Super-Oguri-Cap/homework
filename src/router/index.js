import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Products from '../components/Products.vue';
import Cart from '../components/Cart.vue';
import Checkout from '../components/Checkout.vue';
import OrderList from '../components/OrderList.vue';

const routes = [
  { path: '/login', component: Login },
  { 
    path: '/products', 
    component: Products,
    meta: { requiresAuth: true }
  },
  { 
    path: '/cart', 
    component: Cart,
    meta: { requiresAuth: true }
  },
  { 
    path: '/checkout', 
    component: Checkout,
    meta: { requiresAuth: true }
  },
  { 
    path: '/orders', 
    component: OrderList,
    meta: { requiresAuth: true }
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