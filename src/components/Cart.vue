<template>
  <div class="cart-page">
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/products" class="navbar-brand">🛒 电商管理</a>
        <div class="navbar-nav">
          <router-link to="/products" class="navbar-link" :class="{ active: $route.path === '/products' }">
            商品管理
          </router-link>
          <router-link to="/cart" class="navbar-link" :class="{ active: $route.path === '/cart' }">
            🛒 购物车
            <span v-if="cartStore.cartItems.length > 0" class="cart-badge">{{ cartStore.cartItems.length }}</span>
          </router-link>
          <router-link to="/checkout" class="navbar-link" :class="{ active: $route.path === '/checkout' }">
            结算中心
          </router-link>
          <router-link to="/orders" class="navbar-link" :class="{ active: $route.path === '/orders' }">
            我的订单
          </router-link>
        </div>
        <div class="navbar-user">
          <span class="user-info">{{ userInfo?.username }}</span>
          <button class="btn btn-secondary btn-sm" @click="logout">退出</button>
        </div>
      </div>
    </nav>

    <div class="container page-content">
      <div class="page-header">
        <h1>购物车</h1>
        <p class="page-desc">共 {{ cartStore.cartItems.length }} 件商品</p>
      </div>

      <div v-if="cartStore.loading" class="loading-text">加载中...</div>

      <div v-else-if="cartStore.cartItems.length === 0" class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <div class="empty-state-title">购物车是空的</div>
        <div class="empty-state-desc">快去选购心仪的商品吧</div>
        <router-link to="/products" class="btn btn-primary" style="margin-top: var(--spacing-md)">去购物</router-link>
      </div>

      <div v-else class="cart-content">
        <div class="card">
          <div class="card-header cart-header">
            <label class="checkbox-wrapper" @click="handleSelectAll">
              <input type="checkbox" :checked="cartStore.isAllSelected" />
              <span class="check-mark"></span>
            </label>
            <span>全选</span>
            <div class="header-right">
              <button class="btn btn-danger btn-sm" @click="handleClearSelected">清空选中</button>
            </div>
          </div>

          <div class="card-body">
            <div class="cart-items">
              <div v-for="item in cartStore.cartItems" :key="item.id" class="cart-item">
                <label class="checkbox-wrapper" @click="handleToggleSelect(item.id)">
                  <input type="checkbox" :checked="item.selected" />
                  <span class="check-mark"></span>
                </label>

                <img :src="item.productImage || 'https://via.placeholder.com/80x80'" :alt="item.productName" class="cart-item-image" />

                <div class="cart-item-info">
                  <div class="cart-item-name">{{ item.productName }}</div>
                  <div class="cart-item-price">&yen;{{ item.productPrice.toFixed(2) }}</div>
                </div>

                <div class="quantity-control">
                  <button class="qty-btn" @click="handleDecrease(item)" :disabled="item.quantity <= 1">
                    -
                  </button>
                  <input type="number" class="qty-input" v-model.number="item.quantity" @change="handleQuantityChange(item)" />
                  <button class="qty-btn" @click="handleIncrease(item)" :disabled="item.quantity >= 99">
                    +
                  </button>
                </div>

                <div class="cart-item-total">&yen;{{ (item.productPrice * item.quantity).toFixed(2) }}</div>

                <button class="btn btn-secondary btn-sm delete-btn" @click="handleRemove(item.id)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <div class="summary-left">
            <span>已选 {{ cartStore.selectedCount }} 件商品</span>
          </div>
          <div class="summary-right">
            <span class="summary-label">合计：</span>
            <span class="summary-total">&yen;{{ cartStore.selectedTotalPrice.toFixed(2) }}</span>
            <button
              class="btn btn-primary btn-lg"
              :disabled="cartStore.selectedItems.length === 0"
              @click="goToCheckout"
            >
              去结算
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast toast-success">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const showToast = ref(false);
const toastMessage = ref('');

const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const cartStore = useCartStore();

const showToastMessage = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 2000);
};

const handleSelectAll = async () => {
  try {
    await cartStore.toggleSelectAll(!cartStore.isAllSelected);
  } catch (error) {
    showToastMessage('操作失败：' + (error.message || ''));
  }
};

const handleToggleSelect = async (id) => {
  try {
    await cartStore.toggleItemSelect(id);
  } catch (error) {
    showToastMessage('操作失败：' + (error.message || ''));
  }
};

const handleIncrease = async (item) => {
  try {
    await cartStore.updateQuantity(item.id, item.quantity + 1);
  } catch (error) {
    showToastMessage('更新失败：' + (error.message || ''));
  }
};

const handleDecrease = async (item) => {
  if (item.quantity <= 1) return;
  try {
    await cartStore.updateQuantity(item.id, item.quantity - 1);
  } catch (error) {
    showToastMessage('更新失败：' + (error.message || ''));
  }
};

const handleQuantityChange = async (item) => {
  const qty = Math.max(1, Math.min(99, item.quantity));
  item.quantity = qty;
  try {
    await cartStore.updateQuantity(item.id, qty);
  } catch (error) {
    showToastMessage('更新失败：' + (error.message || ''));
  }
};

const handleRemove = async (id) => {
  if (!confirm('确定要删除这件商品吗？')) return;
  try {
    await cartStore.removeItem(id);
    showToastMessage('已删除');
  } catch (error) {
    showToastMessage('删除失败：' + (error.message || ''));
  }
};

const handleClearSelected = async () => {
  if (cartStore.selectedItems.length === 0) {
    showToastMessage('请先选择商品');
    return;
  }
  if (!confirm('确定要清空所有选中的商品吗？')) return;
  try {
    await cartStore.clearSelected();
    showToastMessage('已清空');
  } catch (error) {
    showToastMessage('操作失败：' + (error.message || ''));
  }
};

const goToCheckout = () => {
  router.push('/checkout');
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  cartStore.fetchCart();
});
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: var(--bg-page);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.5px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-muted);
}

.loading-text {
  text-align: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-muted);
  font-size: 14px;
}

.cart-content {
  max-width: 900px;
  margin: 0 auto;
}

.cart-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-right {
  margin-left: auto;
}

.checkbox-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-wrapper input {
  opacity: 0;
  position: absolute;
  cursor: pointer;
}

.check-mark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  transition: all var(--transition-fast);
}

.checkbox-wrapper:hover .check-mark {
  border-color: var(--primary);
}

.checkbox-wrapper input:checked + .check-mark {
  background-color: var(--primary);
  border-color: var(--primary);
  animation: bounceIn var(--transition-fast);
}

.checkbox-wrapper input:checked + .check-mark::after {
  content: '\2713';
  display: block;
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 16px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-normal);
}

.cart-item:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-md);
  transform: translateX(4px);
}

.cart-item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
  transition: transform var(--transition-fast);
}

.cart-item:hover .cart-item-image {
  transform: scale(1.02);
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-price {
  font-size: 14px;
  color: var(--text-secondary);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0;
  background-color: var(--bg-page);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  background-color: transparent;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--primary-light);
  color: var(--primary);
}

.qty-btn:active:not(:disabled) {
  transform: scale(0.95);
  background-color: var(--primary);
  color: white;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input {
  width: 56px;
  height: 36px;
  text-align: center;
  border: none;
  font-size: 14px;
  font-weight: 600;
  background-color: transparent;
  color: var(--text-primary);
}

.qty-input:focus {
  outline: none;
}

.cart-item-total {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
  width: 100px;
  text-align: right;
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.delete-btn {
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.delete-btn:hover {
  transform: scale(1.05);
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: sticky;
  bottom: 0;
  border: 1px solid var(--border-light);
}

.summary-left {
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.summary-label {
  font-size: 16px;
  color: var(--text-secondary);
}

.summary-total {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cart-badge {
  background-color: var(--primary);
  color: var(--text-white);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  margin-left: 2px;
}

.user-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: var(--spacing-md);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 1024px) {
  .cart-content {
    max-width: 100%;
  }

  .cart-summary {
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
}

@media (max-width: 768px) {
  .cart-item {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }

  .cart-item-image {
    width: 64px;
    height: 64px;
  }

  .cart-item-info {
    flex: 1;
    min-width: 120px;
  }

  .cart-item-total {
    width: auto;
    text-align: left;
  }

  .cart-summary {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .summary-right {
    width: 100%;
    justify-content: space-between;
  }

  .summary-total {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .navbar-nav {
    gap: var(--spacing-xs);
  }

  .navbar-link {
    font-size: 12px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .user-info {
    display: none;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .quantity-control {
    width: 100%;
    justify-content: center;
  }

  .qty-input {
    width: 48px;
  }
}
</style>