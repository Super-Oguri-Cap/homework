// src/stores/order.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/address';
import { createOrder, getOrders, getOrderDetail, cancelOrder } from '../api/order';
import { useCartStore } from './cart';

export const useOrderStore = defineStore('order', () => {
  const addresses = ref([]);
  const selectedAddressId = ref(null);
  const paymentMethod = ref('wechat');
  const remark = ref('');
  const orders = ref([]);
  const currentOrder = ref(null);
  const loading = ref(false);
  const submitting = ref(false);

  // 计算属性：选中的地址
  const selectedAddress = computed(() => {
    return addresses.value.find(a => a.id === selectedAddressId.value) || null;
  });

  // 计算属性：默认地址
  const defaultAddress = computed(() => {
    return addresses.value.find(a => a.isDefault) || null;
  });

  // 支付方式列表
  const paymentMethods = [
    { value: 'wechat', label: '微信支付', icon: '💚' },
    { value: 'alipay', label: '支付宝', icon: '💙' },
    { value: 'bank', label: '银行卡', icon: '💳' }
  ];

  // 获取地址列表
  const fetchAddresses = async () => {
    loading.value = true;
    try {
      const res = await getAddresses();
      if (res.code === 200) {
        addresses.value = res.data;
        // 自动选中默认地址
        if (!selectedAddressId.value) {
          const defaultAddr = addresses.value.find(a => a.isDefault);
          if (defaultAddr) {
            selectedAddressId.value = defaultAddr.id;
          } else if (addresses.value.length > 0) {
            selectedAddressId.value = addresses.value[0].id;
          }
        }
      }
    } catch (error) {
      console.error('获取地址失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 添加地址
  const addNewAddress = async (data) => {
    try {
      const res = await addAddress(data);
      if (res.code === 200) {
        addresses.value.push(res.data);
        if (res.data.isDefault) {
          selectedAddressId.value = res.data.id;
        }
      }
      return res;
    } catch (error) {
      console.error('添加地址失败:', error);
      throw error;
    }
  };

  // 更新地址
  const editAddress = async (id, data) => {
    try {
      const res = await updateAddress(id, data);
      if (res.code === 200) {
        const index = addresses.value.findIndex(a => a.id === id);
        if (index !== -1) {
          addresses.value[index] = res.data;
        }
      }
      return res;
    } catch (error) {
      console.error('更新地址失败:', error);
      throw error;
    }
  };

  // 删除地址
  const removeAddress = async (id) => {
    try {
      const res = await deleteAddress(id);
      if (res.code === 200) {
        addresses.value = addresses.value.filter(a => a.id !== id);
        if (selectedAddressId.value === id) {
          const defaultAddr = addresses.value.find(a => a.isDefault);
          selectedAddressId.value = defaultAddr ? defaultAddr.id : (addresses.value[0]?.id || null);
        }
      }
      return res;
    } catch (error) {
      console.error('删除地址失败:', error);
      throw error;
    }
  };

  // 设为默认地址
  const setDefault = async (id) => {
    try {
      const res = await setDefaultAddress(id);
      if (res.code === 200) {
        addresses.value.forEach(a => a.isDefault = (a.id === id));
      }
      return res;
    } catch (error) {
      console.error('设置默认地址失败:', error);
      throw error;
    }
  };

  // 选择地址
  const selectAddress = (id) => {
    selectedAddressId.value = id;
  };

  // 选择支付方式
  const selectPaymentMethod = (method) => {
    paymentMethod.value = method;
  };

  // 提交订单
  const submitOrder = async () => {
    const cartStore = useCartStore();
    
    if (!selectedAddressId.value) {
      throw new Error('请选择收货地址');
    }
    if (cartStore.selectedItems.length === 0) {
      throw new Error('没有可结算的商品');
    }

    submitting.value = true;
    try {
      const orderData = {
        addressId: selectedAddressId.value,
        payMethod: paymentMethod.value,
        remark: remark.value,
        items: cartStore.selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await createOrder(orderData);
      if (res.code === 200) {
        // 清空已选中的购物车商品
        await cartStore.clearSelected();
        return res.data;
      }
      throw new Error(res.message || '创建订单失败');
    } catch (error) {
      console.error('提交订单失败:', error);
      throw error;
    } finally {
      submitting.value = false;
    }
  };

  // 获取订单列表
  const fetchOrders = async (params = {}) => {
    loading.value = true;
    try {
      const res = await getOrders(params);
      if (res.code === 200) {
        orders.value = res.data.list;
      }
      return res.data;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 获取订单详情
  const fetchOrderDetail = async (id) => {
    loading.value = true;
    try {
      const res = await getOrderDetail(id);
      if (res.code === 200) {
        currentOrder.value = res.data;
      }
      return res.data;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 取消订单
  const cancelUserOrder = async (id) => {
    try {
      const res = await cancelOrder(id);
      if (res.code === 200) {
        const index = orders.value.findIndex(o => o.id === id);
        if (index !== -1) {
          orders.value[index] = res.data;
        }
        if (currentOrder.value?.id === id) {
          currentOrder.value = res.data;
        }
      }
      return res;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  };

  return {
    addresses,
    selectedAddressId,
    selectedAddress,
    defaultAddress,
    paymentMethod,
    paymentMethods,
    remark,
    orders,
    currentOrder,
    loading,
    submitting,
    fetchAddresses,
    addNewAddress,
    editAddress,
    removeAddress,
    setDefault,
    selectAddress,
    selectPaymentMethod,
    submitOrder,
    fetchOrders,
    fetchOrderDetail,
    cancelUserOrder
  };
});
