<template>
  <div class="relative max-w-full mx-auto font-sans text-gray-700 sm:p-6 lg:p-8">
    <LoadingOverlay :show="globalLoading" :status-text="loadingStatusText" />

    <!-- Filters Section -->
    <DashboardFilters
      v-model:dataType="dataType"
      v-model:sourceType="sourceType"
      v-model:activeMetric="activeMetric"
      v-model:selectedYear="selectedYear"
      v-model:filterMode="filterMode"
      v-model:selectedMonth="selectedMonth"
      v-model:selectedQuarter="selectedQuarter"
      :available-years="availableYears"
      :available-months="availableMonths"
      :available-quarters="availableQuarters"
      :metrics="metrics"
      :product-groups="productGroups"
      @open-compare="openCompare"
    />

    <!-- Comparison Modal -->
    <CompareModal
      v-model:show="showCompareModal"
      :current-mode="filterMode"
      :current-value="filterMode === 'quarter' ? selectedQuarter : selectedMonth"
      @compare="handleCompareRequest"
    />

    <!-- Main Chart & Ranking Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 min-h-[520px] flex flex-col relative">
      <div v-show="dashboardData && hasActualData" class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white flex-1 w-full">
        
        <!-- Left: Revenue Chart -->
        <div class="lg:col-span-2 relative">
          <h3 class="text-[17px] text-gray-800 mb-4 font-bold flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {{ isComparisonMode ? "So sánh các năm" : "Biểu đồ Doanh Thu" }}
            </div>

            <button
              v-if="isComparisonMode"
              @click="exitComparison"
              class="text-[11px] font-black text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-wider transition-all"
            >
              Thoát so sánh
            </button>
          </h3>

          <div class="relative w-full h-[360px]">
            <div
              ref="chartRef"
              class="w-full h-full transition-opacity duration-300"
              :class="{ 'opacity-40': isProcessing }"
            ></div>
            
            <!-- Chart Spinner -->
            <transition name="fade-fast">
              <div v-if="isProcessing" class="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                <div class="flex flex-col items-center gap-3 bg-white/80 px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
                  <div class="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Đang tính toán...</span>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Right: Staff Ranking -->
        <StaffRanking
          :rankings="rankings"
          :is-comparison-mode="isComparisonMode"
        />
      </div>

      <!-- Empty State -->
      <div v-if="dashboardData && !hasActualData" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/30 z-20">
        <div class="w-40 h-40 mb-8 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100 relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 2v-6m-8 4h8m-1 9l-1 1H7l-1-1V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="absolute -bottom-2 -right-2 bg-blue-500 p-3 rounded-2xl shadow-lg border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <h4 class="text-2xl font-black text-gray-800 mb-3">Không tìm thấy dữ liệu</h4>
        <p class="text-gray-400 max-w-sm text-center font-medium px-6">Vui lòng thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác để xem thông tin thống kê.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, watch, nextTick, computed } from "vue";
import * as echarts from "echarts";

// Composables & Helpers
import { useDashboard } from "../../composables/useDashboard";
import { getBaseChartOption, getUpdateOption, getComparisonOption } from "../../utils/chartConfig";

// Components
import LoadingOverlay from "../common/LoadingOverlay.vue";
import DashboardFilters from "./DashboardFilters.vue";
import StaffRanking from "./StaffRanking.vue";
import CompareModal from "./CompareModal.vue";

// --- CONFIG ---
const metrics = [
  { id: "withoutVat", name: "Doanh thu (Chưa VAT)" },
  { id: "serviceCount", name: "Số lượng" }
];

// --- STATE ---
const {
  suppressFetch,
  dashboardData,
  rankings,
  isProcessing,
  globalLoading,
  loadingStatusText,
  activeMetric,
  dataType,
  sourceType,
  selectedYear,
  selectedMonth,
  selectedQuarter,
  filterMode,
  showCompareModal,
  isComparisonMode,
  availableYears,
  availableMonths,
  availableQuarters,
  productGroups,
  openCompare,
  loadData,
} = useDashboard();

const chartRef = ref(null);
const chartInstance = shallowRef(null);

const hasActualData = computed(() => {
  if (!dashboardData.value) return false;
  
  // Check if we have ANY non-zero values across ALL essential metrics to decide if we show "No Data"
  // This prevents the dashboard from disappearing if Revenue is 0 but Service Count has data
  const metricsToCheck = ["withVat", "serviceCount"];
  
  const checkValues = (dataObj) => {
    return dataObj && dataObj.values && dataObj.values.some(v => v > 0);
  };

  const checkCompValues = (compData) => {
    if (!compData || !compData.yearData) return false;
    // Iterate through all years in yearData object
    return Object.values(compData.yearData).some(yearValues => 
      yearValues && yearValues.some(v => v > 0)
    );
  };

  if (isComparisonMode.value) {
    return metricsToCheck.some(m => checkCompValues(dashboardData.value.comparisonData[m]));
  } else {
    return metricsToCheck.some(m => checkValues(dashboardData.value.chartData[m]));
  }
});

// --- METHODS ---

const initChart = () => {
  if (chartRef.value && !chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value);
    chartInstance.value.setOption(getBaseChartOption());
    window.addEventListener("resize", () => chartInstance.value?.resize());
  }
};

const handleCompareRequest = (config) => {
  // Suppress the automatic watcher-triggered fetch while we update multiple filters
  suppressFetch.value = true;
  
  if (!selectedYear.value) selectedYear.value = "2025";
  isComparisonMode.value = true;
  filterMode.value = config.mode;
  
  if (config.mode === "month") {
    selectedMonth.value = config.value;
    selectedQuarter.value = ""; // Clear other mode's value
  } else {
    selectedQuarter.value = config.value;
    selectedMonth.value = ""; // Clear other mode's value
  }
  
  // Re-enable fetching and trigger ONE processData call
  nextTick(async () => {
    suppressFetch.value = false;
    await processData();
  });
};

const exitComparison = async () => {
  isComparisonMode.value = false;
  await processData();
};

const processData = async () => {
  try {
    const response = await loadData();
    await nextTick();
    
    // Ensure chart is initialized if it wasn't or if DOM was reset
    if (!chartInstance.value && chartRef.value) {
      initChart();
    }
    
    if (response) {
      updateUI();
      // Important: Call resize when data appears because the container might have been hidden (0x0)
      if (hasActualData.value && chartInstance.value) {
        setTimeout(() => chartInstance.value?.resize(), 100);
      }
    }
  } catch (e) {
    console.error("Process data failed:", e);
  }
};

const updateUI = () => {
  if (!dashboardData.value || !chartInstance.value) return;

  const metricObj = metrics.find((m) => m.id === activeMetric.value);
  const metricName = metricObj?.name || "Doanh thu";

  if (isComparisonMode.value) {
    const configData = dashboardData.value.comparisonData[activeMetric.value];
    if (configData) {
      chartInstance.value.setOption(getComparisonOption(configData, metricName, activeMetric.value), true);
    }
  } else {
    const chartData = dashboardData.value.chartData[activeMetric.value];
    if (chartData) {
      chartInstance.value.setOption(
        getUpdateOption(chartData.labels, chartData.values, metricName, chartData.prevValues, activeMetric.value),
        true
      );
    }
  }
};

// --- LIFECYCLE & WATCHERS ---

onMounted(async () => {
  initChart();
  loadingStatusText.value = "Đang tải báo cáo...";
  await processData();
  globalLoading.value = false;
});

watch(
  [dataType, sourceType, selectedYear, selectedMonth, selectedQuarter, filterMode],
  () => {
    if (!suppressFetch.value) processData();
  }
);

watch(activeMetric, updateUI);
</script>

<style scoped>
.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity 0.3s ease; }
.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }
</style>
