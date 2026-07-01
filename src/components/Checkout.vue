<template>
  <div class="checkout-page">
    <h2 class="page-title">确认订单</h2>

    <div class="checkout-container">
      <!-- 左侧：订单信息 -->
      <div class="checkout-main">
        <!-- 1. 收货地址 -->
        <div class="section">
          <div class="section-header">
            <h3>收货地址</h3>
          </div>
          <div v-if="orderStore.loading" class="loading-text">加载地址中...</div>
          <div v-else class="address-list">
            <div
              v-for="addr in orderStore.addresses"
              :key="addr.id"
              :class="['address-card', { active: orderStore.selectedAddressId === addr.id }]"
              @click="orderStore.selectAddress(addr.id)"
            >
              <div class="address-tags">
                <span v-if="addr.isDefault" class="tag-default">默认</span>
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
          </div>
        </div>

        <!-- 2. 商品清单 -->
        <div class="section">
          <div class="section-header">
            <h3>商品清单</h3>
            <span class="item-count">共 {{ cartStore.selectedCount }} 件</span>
          </div>
          <div v-if="cartStore.loading" class="loading-text">加载商品中...</div>
          <div v-else-if="cartStore.selectedItems.length === 0" class="empty-text">
            没有待结算的商品，请先去购物车选择商品
          </div>
          <div v-else class="product-list">
            <div v-for="item in cartStore.selectedItems" :key="item.id" class="product-item">
              <img :src="item.productImage" :alt="item.productName" class="product-image" />
              <div class="product-info">
                <div class="product-name">{{ item.productName }}</div>
              </div>
              <div class="product-price">&yen;{{ item.productPrice.toFixed(2) }}</div>
              <div class="product-quantity">x{{ item.quantity }}</div>
              <div class="product-subtotal">&yen;{{ (item.productPrice * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 3. 支付方式 -->
        <div class="section">
          <div class="section-header">
            <h3>支付方式</h3>
          </div>
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

        <!-- 4. 订单备注 -->
        <div class="section">
          <div class="section-header">
            <h3>订单备注</h3>
          </div>
          <textarea
            v-model="orderStore.remark"
            class="remark-input"
            placeholder="选填：如有特殊要求请备注"
            maxlength="200"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：金额汇总 -->
      <div class="checkout-sidebar">
        <div class="summary-card">
          <h3>订单汇总</h3>
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
            class="submit-btn"
            :disabled="!canSubmit || orderStore.submitting"
            @click="handleSubmit"
          >
            {{ orderStore.submitting ? '提交中...' : '提交订单' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 提交成功弹窗 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="modal-content success-modal">
        <div class="success-icon">&#10003;</div>
        <h3>订单提交成功！</h3>
        <p>订单编号：{{ createdOrder?.orderNo }}</p>
        <p class="pay-amount">应付金额：&yen;{{ createdOrder?.payAmount?.toFixed(2) }}</p>
        <button class="modal-btn" @click="goToOrders">查看订单</button>
        <button class="modal-btn secondary" @click="showSuccessModal = false">继续购物</button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-toast">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useOrderStore } from '../stores/order';

const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const showSuccessModal = ref(false);
const createdOrder = ref(null);
const errorMsg = ref('');

// 运费：满99包邮，否则10元
const freight = computed(() => {
  return cartStore.selectedTotalPrice >= 99 ? 0 : 10;
});

// 优惠（暂不支持优惠券，固定为0）
const discount = computed(() => 0);

// 应付总额
const payAmount = computed(() => {
  return cartStore.selectedTotalPrice + freight.value - discount.value;
});

// 是否可以提交
const canSubmit = computed(() => {
  return orderStore.selectedAddressId && cartStore.selectedItems.length > 0;
});

// 提交订单
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

// 跳转到订单页
const goToOrders = () => {
  showSuccessModal.value = false;
  router.push('/orders');
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #333;
}

.checkout-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.checkout-main {
  flex: 1;
  min-width: 0;
}

.checkout-sidebar {
  width: 360px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.item-count {
  font-size: 13px;
  color: #999;
}

.loading-text, .empty-text {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}

/* 地址卡片 */
.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-card {
  display: flex;
  align-items: flex-start;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.address-card:hover {
  border-color: #b3d8ff;
}

.address-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.address-tags {
  margin-right: 12px;
  flex-shrink: 0;
}

.tag-default {
  display: inline-block;
  background: #409eff;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.address-info {
  flex: 1;
}

.address-contact {
  margin-bottom: 4px;
}

.receiver {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-right: 16px;
}

.phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}

.address-check {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.check-icon {
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
}

/* 商品列表 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  background: #f5f5f5;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 14px;
  color: #666;
  width: 80px;
  text-align: right;
}

.product-quantity {
  font-size: 14px;
  color: #999;
  width: 40px;
  text-align: center;
}

.product-subtotal {
  font-size: 15px;
  font-weight: 600;
  color: #e74c3c;
  width: 90px;
  text-align: right;
}

/* 支付方式 */
.payment-methods {
  display: flex;
  gap: 12px;
}

.payment-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-card:hover {
  border-color: #b3d8ff;
}

.payment-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.payment-icon {
  font-size: 20px;
}

.payment-label {
  font-size: 14px;
  color: #333;
}

/* 备注 */
.remark-input {
  width: 100%;
  height: 80px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.remark-input:focus {
  outline: none;
  border-color: #409eff;
}

/* 汇总卡片 */
.summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.summary-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #333;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.summary-row.discount {
  color: #e74c3c;
}

.summary-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 0;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.total-price {
  color: #e74c3c;
  font-size: 22px;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #c0392b;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 成功弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.success-icon {
  width: 56px;
  height: 56px;
  line-height: 56px;
  background: #67c23a;
  color: #fff;
  border-radius: 50%;
  font-size: 28px;
  margin: 0 auto 16px;
}

.success-modal h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.success-modal p {
  margin: 6px 0;
  font-size: 14px;
  color: #666;
}

.pay-amount {
  font-size: 18px !important;
  color: #e74c3c !important;
  font-weight: 600;
}

.modal-btn {
  margin: 12px 8px 0;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: #409eff;
  color: #fff;
  transition: background 0.2s;
}

.modal-btn:hover {
  background: #337ecc;
}

.modal-btn.secondary {
  background: #f0f0f0;
  color: #666;
}

.modal-btn.secondary:hover {
  background: #e0e0e0;
}

/* 错误提示 */
.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #f56c6c;
  color: #fff;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 响应式 */
@media (max-width: 768px) {
  .checkout-container {
    flex-direction: column;
  }
  
  .checkout-sidebar {
    width: 100%;
    position: static;
  }

  .payment-methods {
    flex-direction: column;
  }
}
</style>
