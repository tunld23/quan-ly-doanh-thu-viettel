<script setup>
import { ref, onMounted } from 'vue';
import { dashboardService, adjustmentService } from '../services/apiService';
import AdjustmentForm from '../components/adjustments/AdjustmentForm.vue';
import AdjustmentHistory from '../components/adjustments/AdjustmentHistory.vue';

const staffList = ref([]);
const productGroupList = ref([]);
const adjustmentHistory = ref([]);
const submitting = ref(false);
const formRef = ref(null);

const fetchData = async () => {
  try {
    const [staffRes, groupRes, historyRes] = await Promise.all([
      dashboardService.getStaffNames(),
      dashboardService.getProductGroups(),
      adjustmentService.getAdjustments()
    ]);
    staffList.value = staffRes.data;
    productGroupList.value = groupRes.data;
    adjustmentHistory.value = historyRes.data;
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
};

onMounted(fetchData);

const handleNewAdjustment = async (formData) => {
  submitting.value = true;
  try {
    await adjustmentService.createAdjustment(formData);
    await fetchData();
    formRef.value?.reset();
    alert("Đã lưu thành công!");
  } catch (err) {
    alert("Lỗi: " + (err.response?.data?.error || err.message));
  } finally {
    submitting.value = false;
  }
};

const handleDeleteAdjustment = async (id) => {
  if (!confirm("Xóa lệnh điều chỉnh này?")) return;
  try {
    await adjustmentService.deleteAdjustment(id);
    await fetchData();
  } catch (err) {
    alert("Xóa thất bại");
  }
};
</script>

<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 text-center">Điều chỉnh Doanh thu</h1>
    <div class="grid grid-cols-1 gap-8">
      <AdjustmentForm 
        ref="formRef"
        :staff-list="staffList" 
        :submitting="submitting" 
        @submit="handleNewAdjustment" 
      />
      <AdjustmentHistory 
        class="mt-8"
        :history="adjustmentHistory" 
        @delete="handleDeleteAdjustment" 
      />
    </div>
  </div>
</template>
