<script setup>
import { ref, onMounted } from "vue";
import { dashboardService, adjustmentService } from "../services/apiService";
import AdjustmentForm from "../components/adjustments/AdjustmentForm.vue";
import AdjustmentHistory from "../components/adjustments/AdjustmentHistory.vue";
import { useToast } from "../composables/useToast";

const toast = useToast();

const staffList = ref([]);
const productGroupList = ref([]);
const adjustmentHistory = ref([]);
const submitting = ref(false);
const formRef = ref(null);

const fetchData = async (year) => {
  try {
    const [staffRes, groupRes, historyRes] = await Promise.all([
      dashboardService.getStaffNames({ year }),
      dashboardService.getProductGroups(),
      adjustmentService.getAdjustments(),
    ]);
    staffList.value = staffRes.data;
    productGroupList.value = groupRes.data;
    adjustmentHistory.value = historyRes.data;
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
};

const onYearChange = (year) => {
  fetchData(year);
};

onMounted(() => {
  const currentYear = new Date().getFullYear();
  fetchData(currentYear);
});

const handleNewAdjustment = async (formData) => {
  submitting.value = true;
  try {
    await adjustmentService.createAdjustment(formData);
    await fetchData();
    formRef.value?.reset();
    toast.success("Đã lưu thành công!");
  } catch (err) {
    toast.error("Lỗi: " + (err.response?.data?.error || err.message));
  } finally {
    submitting.value = false;
  }
};

const handleDeleteAdjustment = async (id) => {
  if (!confirm("Xóa lệnh điều chỉnh này?")) return;
  try {
    await adjustmentService.deleteAdjustment(id);
    await fetchData();
    toast.success("Xóa thành công");
  } catch (err) {
    toast.error("Xóa thất bại");
  }
};
</script>

<template>
  <div class="max-w-md mx-auto">
    <h1
      class="text-3xl lg:text-[40px] font-black text-[#1b254b] tracking-tight leading-none my-4 drop-shadow-sm"
    >
      Điều chỉnh Doanh thu
    </h1>
    <div class="grid grid-cols-1 gap-8">
      <AdjustmentForm
        ref="formRef"
        :staff-list="staffList"
        :submitting="submitting"
        @submit="handleNewAdjustment"
        @year-change="onYearChange"
      />
      <AdjustmentHistory
        class="mt-8"
        :history="adjustmentHistory"
        @delete="handleDeleteAdjustment"
      />
    </div>
  </div>
</template>
