<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  isComparisonMode: Boolean,
  isSinglePoint: Boolean,
  timeLabel: String,
  activeMetric: String,
  viewMode: String,
  dataType: String,
  selectedYear: [String, Number],
});

const emit = defineEmits(["chart-ready", "pie-ready", "exit-comparison"]);

const chartRef = ref(null);
const pieChartRef = ref(null);
let chart = null;
let pie = null;

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    emit("chart-ready", chart);
  }
  if (pieChartRef.value) {
    pie = echarts.init(pieChartRef.value);
    emit("pie-ready", pie);
  }
});

onUnmounted(() => {
  chart?.dispose();
  pie?.dispose();
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-gray-100">
    <div class="lg:col-span-8 relative bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
      <h3 class="text-[18px] text-gray-800 mb-6 font-black flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          {{
            isComparisonMode
              ? isSinglePoint
                ? `So sánh xu hướng ${activeMetric === 'serviceCount' ? 'số lượng' : 'doanh thu'} ${timeLabel.toLowerCase()} qua các năm`
                : `Biểu đồ so sánh doanh thu 12 tháng qua các năm`
              : `${viewMode === 'subscriber' ? 'Số lượng thuê bao' : activeMetric === 'serviceCount' ? 'Số lượng' : 'Doanh Thu'} `
          }}
        </div>
        <button v-if="isComparisonMode" @click="$emit('exit-comparison')" class="text-[11px] font-black text-blue-600 hover:bg-blue-600 hover:text-white bg-white px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest transition-all shadow-sm active:scale-95">Thoát so sánh</button>
      </h3>
      <div class="relative w-full h-[420px]">
        <div ref="chartRef" class="w-full h-full"></div>
      </div>
    </div>

    <div class="lg:col-span-4">
      <div class="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 h-full flex flex-col">
        <h4 class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2">
          <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
          {{ viewMode === 'subscriber' ? 'Tỷ trọng thuê bao' : dataType === 'all' ? 'Cơ cấu' : 'Tỷ trọng đóng góp' }}
          {{ viewMode === 'subscriber' ? '' : activeMetric === 'serviceCount' ? 'Số lượng' : 'Doanh Thu' }}
          {{ dataType === 'all' ? (selectedYear ? '(Năm ' + selectedYear + ')' : '(Tổng cộng)') : 'Theo Năm' }}
        </h4>
        <div class="relative w-full flex-1 min-h-[420px]">
          <div ref="pieChartRef" class="w-full h-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>
