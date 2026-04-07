<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import EmptyData from "../common/EmptyData.vue";

const props = defineProps({
  hasRevenueTargetData: Boolean,
  hasSubTargetData: Boolean,
});

const emit = defineEmits(["rev-chart-ready", "sub-chart-ready"]);

const revChartRef = ref(null);
const subChartRef = ref(null);
let revChart = null;
let subChart = null;

onMounted(() => {
  if (revChartRef.value) {
    revChart = echarts.init(revChartRef.value);
    emit("rev-chart-ready", revChart);
  }
  if (subChartRef.value) {
    subChart = echarts.init(subChartRef.value);
    emit("sub-chart-ready", subChart);
  }
});

onUnmounted(() => {
  revChart?.dispose();
  subChart?.dispose();
});
</script>

<template>
  <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white flex-1 w-full">
    <!-- Revenue Achievement -->
    <div class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100 flex flex-col">
      <h3 class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2">
        <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
        Tỷ lệ hoàn thành theo Doanh Thu
      </h3>
      <div class="relative w-full flex-1 min-h-[380px]">
        <div v-show="hasRevenueTargetData" ref="revChartRef" class="w-full h-full"></div>
        <EmptyData v-if="!hasRevenueTargetData" title="Không có dữ liệu DT" message="Chưa có thông tin chỉ tiêu hoặc doanh thu cho mục này." class="scale-75" />
      </div>
    </div>

    <!-- Subscribers Achievement -->
    <div class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100 flex flex-col">
      <h3 class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2">
        <div class="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
        Tỷ lệ hoàn thành theo Thuê Bao
      </h3>
      <div class="relative w-full flex-1 min-h-[380px]">
        <div v-show="hasSubTargetData" ref="subChartRef" class="w-full h-full"></div>
        <EmptyData v-if="!hasSubTargetData" title="Không có dữ liệu TB" message="Chưa có thông tin chỉ tiêu hoặc thuê bao cho mục này." class="scale-75" />
      </div>
    </div>
  </div>
</template>
