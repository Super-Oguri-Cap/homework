<template>
  <div class="orders-page">
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/products" class="navbar-brand">🛒 电商管理</a>
        <div class="navbar-nav">
          <router-link to="/products" class="navbar-link" :class="{ active: $route.path === '/products' }">
            商品管理
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
        <h1>我的订单</h1>
        <p class="page-desc">共 {{ orders.length }} 个订单</p>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-btn', { active: currentTab === tab.value }]"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">暂无订单</div>
        <div class="empty-state-desc">快去选购心仪的商品吧</div>
      </div>

      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.id" class="card order-card">
          <div class="card-header">
            <div class="order-header-left">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-time">{{ formatTime(order.createdAt) }}</span>
            </div>
            <span :class="['tag', statusTagClass(order.status)]">
              {{ statusLabels[order.status] || order.status }}
            </span>
          </div>

          <div class="card-body">
            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <div class="item-info">
                  <span class="item-name">{{ item.productName }}</span>
                  <span class="item-price">&yen;{{ item.productPrice.toFixed(2) }}</span>
                  <span class="item-qty">x{{ item.quantity }}</span>
                </div>
                <div class="item-total">&yen;{{ item.totalPrice.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="order-summary">
              共 {{ order.items?.length || 0 }} 件商品
              <span class="total-amount">&yen;{{ (order.payAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="order-actions">
              <button
                v-if="order.status === 'pending'"
                class="btn btn-danger btn-sm"
                @click="handleCancel(order.id)"
              >
                取消订单
              </button>
              <button class="btn btn-secondary btn-sm" @click="viewDetail(order.id)">查看详情</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '../stores/order';

const router = useRouter();
const orderStore = useOrderStore();

const orders = ref([]);
const loading = ref(false);
const currentTab = ref('');
const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'));

const tabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const statusLabels = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const statusTagClass = (status) => {
  const map = {
    pending: 'tag-warning',
    paid: 'tag-info',
    shipped: 'tag-primary',
    completed: 'tag-success',
    cancelled: 'tag-danger',
  };
  return map[status] || 'tag-primary';
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const switchTab = (tab) => {
  currentTab.value = tab;
  loadOrders();
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const params = {};
    if (currentTab.value) params.status = currentTab.value;
    await orderStore.fetchOrders(params);
    orders.value = orderStore.orders || [];
  } catch (err) {
    console.error('加载订单失败:', err);
  } finally {
    loading.value = false;
  }
};

const handleCancel = async (id) => {
  if (!confirm('确定要取消此订单吗？')) return;
  try {
    await orderStore.cancelUserOrder(id);
    await loadOrders();
  } catch (err) {
    alert('取消失败：' + (err.message || '请稍后重试'));
  }
};

const viewDetail = (id) => {
  router.push('/orders');
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: var(--bg-page);
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--border-light);
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  background: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-card {
  overflow: hidden;
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.order-no {
  font-size: 14px;
  color: var(--text-secondary);
}

.order-time {
  font-size: 13px;
  color: var(--text-muted);
}

.order-items {
  padding: var(--spacing-md) 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.item-name {
  color: var(--text-primary);
  min-width: 120px;
  font-size: 14px;
}

.item-price {
  color: var(--text-muted);
  font-size: 13px;
}

.item-qty {
  color: var(--text-muted);
  font-size: 13px;
}

.item-total {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.order-summary {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-amount {
  color: var(--primary);
  font-weight: 700;
  font-size: 16px;
  margin-left: var(--spacing-sm);
}

.order-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.loading-text {
  text-align: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-muted);
  font-size: 14px;
}

.user-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: var(--spacing-md);
}

@media (max-width: 768px) {
  .tab-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 13px;
  }

  .order-header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .order-item {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .item-info {
    flex-wrap: wrap;
  }

  .item-name {
    min-width: auto;
    flex: 1;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
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
}
</style>