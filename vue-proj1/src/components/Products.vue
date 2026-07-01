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