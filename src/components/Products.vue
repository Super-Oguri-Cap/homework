<template>
  <div class="products-page">
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
        <h1>商品管理</h1>
        <p class="page-desc">共 {{ products.length }} 个商品</p>
      </div>

      <div class="products-grid">
        <div v-for="product in products" :key="product.id" class="product-card">
          <div class="product-image-wrapper">
            <img :src="product.image || 'https://via.placeholder.com/200x200'" :alt="product.name" class="product-image" />
            <span v-if="product.stock < 10" class="stock-warning">仅剩 {{ product.stock }} 件</span>
          </div>
          <div class="product-info">
            <div class="product-header">
              <h3 class="product-name">{{ product.name }}</h3>
              <span class="tag tag-primary">{{ product.category || '未分类' }}</span>
            </div>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-price">
              <span class="price">&yen;{{ product.price.toFixed(2) }}</span>
              <span class="sales">销量 {{ product.sales }}</span>
            </div>
            <div class="product-footer">
              <span class="stock">库存: {{ product.stock }}</span>
              <div class="product-actions">
                <button class="btn btn-secondary btn-sm" @click="editProduct(product)">编辑</button>
                <button
                  class="btn btn-primary btn-sm"
                  @click="addToCart(product)"
                  :disabled="product.stock <= 0"
                >
                  🛒 加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="products.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">暂无商品</div>
        <div class="empty-state-desc">请添加商品</div>
      </div>
    </div>

    <div v-if="editingProduct" class="modal-overlay" @click.self="editingProduct = null">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑商品</h3>
          <button class="modal-close" @click="editingProduct = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">商品名称</label>
            <input v-model="editingProduct.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">价格</label>
            <input v-model.number="editingProduct.price" type="number" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">库存</label>
            <input v-model.number="editingProduct.stock" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <input v-model="editingProduct.category" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="editingProduct.description" class="form-input form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingProduct = null">取消</button>
          <button class="btn btn-primary" @click="saveProduct">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast toast-success">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProducts, updateProduct } from '../api/product';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const products = ref([]);
const editingProduct = ref(null);
const showToast = ref(false);
const toastMessage = ref('');

const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const cartStore = useCartStore();

const showToastMessage = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 2000);
};

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

const editProduct = (product) => {
  editingProduct.value = { ...product };
};

const saveProduct = async () => {
  if (!editingProduct.value) return;
  try {
    const { id, name, price, stock, category, description } = editingProduct.value;
    const res = await updateProduct(id, { name, price, stock, category, description });
    if (res.code === 200) {
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

const addToCart = async (product) => {
  if (product.stock <= 0) {
    showToastMessage('库存不足');
    return;
  }
  try {
    await cartStore.addItem(product.id, 1);
    showToastMessage('已加入购物车');
  } catch (error) {
    showToastMessage('添加失败：' + (error.message || ''));
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  fetchProducts();
  cartStore.fetchCart();
});
</script>

<style scoped>
.products-page {
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.product-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-slow);
  position: relative;
}

.product-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-6px);
}

.product-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-hover) 0%, var(--border-light) 100%);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.product-card:hover .product-image {
  transform: scale(1.08);
}

.product-image-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.1) 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
  pointer-events: none;
}

.product-card:hover .product-image-wrapper::after {
  opacity: 1;
}

.stock-warning {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background-color: var(--danger);
  color: var(--text-white);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
  animation: pulse-glow 2s infinite;
  z-index: 1;
}

.product-info {
  padding: var(--spacing-lg);
}

.product-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.price {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sales {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 6px;
  background-color: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

.stock {
  font-size: 13px;
  color: var(--text-secondary);
}

.product-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.cart-badge {
  background-color: var(--primary);
  color: var(--text-white);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  margin-left: 2px;
  animation: bounceIn var(--transition-fast);
}

.user-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: var(--spacing-md);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  background-color: var(--bg-hover);
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-md);
  }

  .product-image-wrapper {
    height: 160px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .product-actions {
    flex-direction: column;
  }

  .price {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

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
}
</style>