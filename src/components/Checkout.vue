<template>
  <div class="checkout-page">
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/products" class="navbar-brand">🛒 电商管理</a>
        <div class="navbar-nav">
          <router-link to="/products" class="navbar-link" :class="{ active: $route.path === '/products' }">
            商品管理
          </router-link>
          <router-link to="/cart" class="navbar-link" :class="{ active: $route.path === '/cart' }">
            🛒 购物车
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
        <h1>确认订单</h1>
        <p class="page-desc">请确认以下订单信息后提交</p>
      </div>

      <div class="checkout-container">
        <div class="checkout-main">
          <div class="card">
            <div class="card-header">
              <span>收货地址</span>
              <button class="btn btn-outline btn-sm" @click="openAddressModal()">+ 新增地址</button>
            </div>
            <div class="card-body">
              <div v-if="orderStore.loading" class="loading-text">加载地址中...</div>
              <div v-else class="address-list">
                <div
                  v-for="addr in orderStore.addresses"
                  :key="addr.id"
                  :class="['address-card', { active: orderStore.selectedAddressId === addr.id }]"
                >
                  <div class="address-main" @click="orderStore.selectAddress(addr.id)">
                    <div class="address-tags">
                      <span v-if="addr.isDefault" class="tag tag-primary">默认</span>
                    </div>
                    <div class="address-info">
                      <div class="address-contact">
                        <span class="receiver">{{ addr.receiver }}</span>
                        <span class="phone">{{ addr.phone }}</span>
                      </div>
                      <div class="address-detail">
                        {{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}
                      </div>
                    </div>
                    <div class="address-check">
                      <span v-if="orderStore.selectedAddressId === addr.id" class="check-icon">&#10003;</span>
                    </div>
                  </div>
                  <div class="address-actions">
                    <button class="action-btn" @click="openAddressModal(addr)">编辑</button>
                    <button class="action-btn" @click="handleSetDefault(addr.id)" v-if="!addr.isDefault">设默认</button>
                    <button class="action-btn delete" @click="handleDeleteAddress(addr.id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span>商品清单</span>
              <span class="item-count">共 {{ cartStore.selectedCount }} 件</span>
            </div>
            <div class="card-body">
              <div v-if="cartStore.loading" class="loading-text">加载商品中...</div>
              <div v-else-if="cartStore.selectedItems.length === 0" class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <div class="empty-state-title">购物车为空</div>
                <div class="empty-state-desc">请先去商品列表添加商品到购物车</div>
              </div>
              <div v-else class="product-list">
                <div v-for="item in cartStore.selectedItems" :key="item.id" class="product-item">
                  <img :src="item.productImage || 'https://via.placeholder.com/80x80'" :alt="item.productName" class="product-image" />
                  <div class="product-info">
                    <div class="product-name">{{ item.productName }}</div>
                  </div>
                  <div class="product-price">&yen;{{ item.productPrice.toFixed(2) }}</div>
                  <div class="product-quantity">x{{ item.quantity }}</div>
                  <div class="product-subtotal">&yen;{{ (item.productPrice * item.quantity).toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">支付方式</div>
            <div class="card-body">
              <div class="payment-methods">
                <div
                  v-for="method in orderStore.paymentMethods"
                  :key="method.value"
                  :class="['payment-card', { active: orderStore.paymentMethod === method.value }]"
                  @click="orderStore.selectPaymentMethod(method.value)"
                >
                  <span class="payment-icon">{{ method.icon }}</span>
                  <span class="payment-label">{{ method.label }}</span>
                  <span v-if="orderStore.paymentMethod === method.value" class="check-icon">&#10003;</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">订单备注</div>
            <div class="card-body">
              <textarea
                v-model="orderStore.remark"
                class="form-input form-textarea"
                placeholder="选填：如有特殊要求请备注"
                maxlength="200"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="checkout-sidebar">
          <div class="card sticky-card">
            <div class="card-header">订单汇总</div>
            <div class="card-body">
              <div class="summary-row">
                <span>商品总价</span>
                <span>&yen;{{ cartStore.selectedTotalPrice.toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>运费</span>
                <span>{{ freight > 0 ? '&yen;' + freight.toFixed(2) : '免运费' }}</span>
              </div>
              <div class="summary-row discount">
                <span>优惠</span>
                <span>-&yen;{{ discount.toFixed(2) }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>应付总额</span>
                <span class="total-price">&yen;{{ payAmount.toFixed(2) }}</span>
              </div>
              <button
                class="btn btn-primary btn-lg btn-block"
                :disabled="!canSubmit || orderStore.submitting"
                @click="handleSubmit"
                style="margin-top: var(--spacing-lg)"
              >
                {{ orderStore.submitting ? '提交中...' : '提交订单' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="success-icon">&#10003;</div>
        </div>
        <div class="modal-body">
          <h3>订单提交成功！</h3>
          <p>订单编号：{{ createdOrder?.orderNo }}</p>
          <p class="pay-amount">应付金额：&yen;{{ createdOrder?.payAmount?.toFixed(2) }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSuccessModal = false">继续购物</button>
          <button class="btn btn-primary" @click="goToOrders">查看订单</button>
        </div>
      </div>
    </div>

    <div v-if="showAddressModal" class="modal-overlay" @click.self="showAddressModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingAddress ? '编辑地址' : '新增地址' }}</h3>
          <button class="modal-close" @click="closeAddressModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">收货人</label>
            <input v-model="addressForm.receiver" class="form-input" placeholder="请输入收货人姓名" />
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="addressForm.phone" class="form-input" placeholder="请输入手机号" />
          </div>
          <div class="form-group">
            <label class="form-label">省市区</label>
            <div class="region-selector">
              <select v-model="addressForm.province" class="region-select" @change="onProvinceChange">
                <option value="">请选择省份</option>
                <option v-for="p in regions" :key="p.name" :value="p.name">{{ p.name }}</option>
              </select>
              <select v-model="addressForm.city" class="region-select" :disabled="!addressForm.province">
                <option value="">请选择城市</option>
                <option v-for="c in currentCities" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
              <select v-model="addressForm.district" class="region-select" :disabled="!addressForm.city">
                <option value="">请选择区县</option>
                <option v-for="d in currentDistricts" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">详细地址</label>
            <textarea v-model="addressForm.detail" class="form-input form-textarea" placeholder="请输入详细地址"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="addressForm.isDefault" />
              设为默认地址
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddressModal()">取消</button>
          <button class="btn btn-primary" @click="saveAddress()">保存</button>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="toast toast-error">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useOrderStore } from '../stores/order';
import { regions } from '../assets/region';

const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const showSuccessModal = ref(false);
const createdOrder = ref(null);
const errorMsg = ref('');
const showAddressModal = ref(false);
const editingAddress = ref(null);
const addressForm = ref({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
});

const freight = computed(() => {
  return cartStore.selectedTotalPrice >= 99 ? 0 : 10;
});

const discount = computed(() => 0);

const payAmount = computed(() => {
  return cartStore.selectedTotalPrice + freight.value - discount.value;
});

const canSubmit = computed(() => {
  return orderStore.selectedAddressId && cartStore.selectedItems.length > 0;
});

const currentCities = computed(() => {
  const province = regions.find(p => p.name === addressForm.value.province);
  return province?.children || [];
});

const currentDistricts = computed(() => {
  const province = regions.find(p => p.name === addressForm.value.province);
  const city = province?.children.find(c => c.name === addressForm.value.city);
  return city?.children || [];
});

const onProvinceChange = () => {
  addressForm.value.city = '';
  addressForm.value.district = '';
};

const openAddressModal = (addr = null) => {
  editingAddress.value = addr;
  if (addr) {
    addressForm.value = {
      receiver: addr.receiver,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      isDefault: addr.isDefault || false
    };
  } else {
    addressForm.value = {
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    };
  }
  showAddressModal.value = true;
};

const closeAddressModal = () => {
  showAddressModal.value = false;
  editingAddress.value = null;
};

const saveAddress = async () => {
  const { receiver, phone, province, city, district, detail, isDefault } = addressForm.value;
  if (!receiver || !phone || !province || !city || !district || !detail) {
    alert('请填写完整地址信息');
    return;
  }
  try {
    if (editingAddress.value) {
      await orderStore.editAddress(editingAddress.value.id, { receiver, phone, province, city, district, detail, isDefault });
      alert('地址更新成功');
    } else {
      await orderStore.addNewAddress({ receiver, phone, province, city, district, detail, isDefault });
      alert('地址添加成功');
    }
    closeAddressModal();
  } catch (error) {
    alert('操作失败：' + (error.message || ''));
  }
};

const handleSetDefault = async (id) => {
  try {
    await orderStore.setDefault(id);
    alert('已设为默认地址');
  } catch (error) {
    alert('操作失败：' + (error.message || ''));
  }
};

const handleDeleteAddress = async (id) => {
  if (!confirm('确定要删除这个地址吗？')) return;
  try {
    await orderStore.removeAddress(id);
    alert('地址已删除');
  } catch (error) {
    alert('操作失败：' + (error.message || ''));
  }
};

const handleSubmit = async () => {
  errorMsg.value = '';
  try {
    const order = await orderStore.submitOrder();
    createdOrder.value = order;
    showSuccessModal.value = true;
  } catch (error) {
    errorMsg.value = error.message || '提交订单失败，请重试';
    setTimeout(() => { errorMsg.value = ''; }, 3000);
  }
};

const goToOrders = () => {
  showSuccessModal.value = false;
  router.push('/orders');
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(async () => {
  await Promise.all([
    cartStore.fetchCart(),
    orderStore.fetchAddresses()
  ]);
});
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background-color: var(--bg-page);
}

.checkout-container {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
}

.checkout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.checkout-sidebar {
  width: 360px;
  flex-shrink: 0;
}

.sticky-card {
  position: sticky;
  top: 80px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-count {
  font-size: 13px;
  color: var(--text-muted);
}

.loading-text {
  text-align: center;
  color: var(--text-muted);
  padding: var(--spacing-lg) 0;
  font-size: 14px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.address-card {
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  background-color: var(--bg-card);
}

.address-card:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.address-card.active {
  border-color: var(--primary);
  background-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  animation: borderPulse var(--transition-slow);
}

.address-main {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-lg);
  cursor: pointer;
}

.address-tags {
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.address-info {
  flex: 1;
}

.address-contact {
  margin-bottom: var(--spacing-xs);
}

.receiver {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-right: var(--spacing-lg);
}

.phone {
  font-size: 14px;
  color: var(--text-secondary);
}

.address-detail {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

.address-check {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: var(--primary);
  font-size: 16px;
  font-weight: 800;
}

.address-card.active .check-icon {
  animation: bounceIn var(--transition-fast);
}

.address-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  background-color: var(--bg-hover);
}

.action-btn {
  font-size: 12px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  color: var(--primary);
  background-color: var(--primary-light);
}

.action-btn.delete:hover {
  color: var(--danger);
  background-color: var(--danger-light);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.product-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-light);
  transition: opacity var(--transition-fast);
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 14px;
  color: var(--text-secondary);
  width: 80px;
  text-align: right;
}

.product-quantity {
  font-size: 13px;
  color: var(--text-muted);
  width: 40px;
  text-align: center;
}

.product-subtotal {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  width: 90px;
  text-align: right;
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.payment-methods {
  display: flex;
  gap: var(--spacing-sm);
}

.payment-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  background-color: var(--bg-card);
}

.payment-card:hover {
  border-color: var(--primary-border);
  transform: translateY(-2px);
}

.payment-card.active {
  border-color: var(--primary);
  background-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  transform: translateY(0);
}

.payment-icon {
  font-size: 24px;
}

.payment-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-row.discount {
  color: var(--primary);
}

.summary-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  margin: var(--spacing-lg) 0;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.total-price {
  color: var(--primary);
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.success-icon {
  width: 64px;
  height: 64px;
  line-height: 64px;
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
  color: var(--text-white);
  border-radius: 50%;
  font-size: 32px;
  margin: 0 auto var(--spacing-lg);
  text-align: center;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  animation: bounceIn var(--transition-slow);
}

.modal-body h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.modal-body p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  text-align: center;
}

.pay-amount {
  font-size: 20px !important;
  color: var(--primary) !important;
  font-weight: 700 !important;
}

.region-selector {
  display: flex;
  gap: var(--spacing-sm);
}

.region-select {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.region-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.region-select:hover:not(:disabled) {
  border-color: var(--border-focus);
}

.region-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: var(--spacing-md);
}

@keyframes borderPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
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

@media (max-width: 1024px) {
  .checkout-sidebar {
    width: 320px;
  }
}

@media (max-width: 768px) {
  .checkout-container {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .checkout-sidebar {
    width: 100%;
  }

  .sticky-card {
    position: static;
  }

  .payment-methods {
    flex-direction: column;
  }

  .product-item {
    flex-wrap: wrap;
  }

  .product-price,
  .product-quantity,
  .product-subtotal {
    width: auto;
    text-align: right;
    margin-left: auto;
  }

  .region-selector {
    flex-direction: column;
  }

  .total-price {
    font-size: 24px;
  }
}
</style>