// src/stores/cart.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  toggleSelect,
  selectAll,
  clearSelectedItems
} from '../api/cart';

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref([]);
  const loading = ref(false);

  // 计算属性：选中的商品
  const selectedItems = computed(() => {
    return cartItems.value.filter(item => item.selected);
  });

  // 计算属性：选中商品总价
  const selectedTotalPrice = computed(() => {
    return selectedItems.value.reduce((sum, item) => {
      return sum + item.productPrice * item.quantity;
    }, 0);
  });

  // 计算属性：选中商品总数量
  const selectedCount = computed(() => {
    return selectedItems.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  // 计算属性：是否全选
  const isAllSelected = computed(() => {
    return cartItems.value.length > 0 && cartItems.value.every(item => item.selected);
  });

  // 获取购物车数据
  const fetchCart = async () => {
    loading.value = true;
    try {
      const res = await getCart();
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('获取购物车失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 添加商品到购物车
  const addItem = async (productId, quantity = 1) => {
    try {
      const res = await addToCart(productId, quantity);
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('添加购物车失败:', error);
      throw error;
    }
  };

  // 更新商品数量
  const updateQuantity = async (id, quantity) => {
    try {
      const res = await updateCartItem(id, quantity);
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('更新数量失败:', error);
      throw error;
    }
  };

  // 删除商品
  const removeItem = async (id) => {
    try {
      const res = await removeCartItem(id);
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  };

  // 切换选中状态
  const toggleItemSelect = async (id) => {
    try {
      const res = await toggleSelect(id);
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('切换选中失败:', error);
      throw error;
    }
  };

  // 全选/取消全选
  const toggleSelectAll = async (selected) => {
    try {
      const res = await selectAll(selected);
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('全选操作失败:', error);
      throw error;
    }
  };

  // 清空已选商品（下单后调用）
  const clearSelected = async () => {
    try {
      const res = await clearSelectedItems();
      if (res.code === 200) {
        cartItems.value = res.data;
      }
    } catch (error) {
      console.error('清空选中商品失败:', error);
      throw error;
    }
  };

  return {
    cartItems,
    loading,
    selectedItems,
    selectedTotalPrice,
    selectedCount,
    isAllSelected,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    toggleItemSelect,
    toggleSelectAll,
    clearSelected
  };
});
