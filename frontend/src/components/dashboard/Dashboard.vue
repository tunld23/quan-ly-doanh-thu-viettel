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
      v-model:viewMode="viewMode"
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
      <!-- ACTUAL VIEW: Chart + Ranking -->
      <div v-show="viewMode === 'actual' && dashboardData && hasActualData" class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white flex-1 w-full">
        <!-- Left: Main Chart -->
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
            <div ref="chartRef" class="w-full h-full"></div>
          </div>
        </div>

        <!-- Right: Staff Ranking -->
        <StaffRanking
          :rankings="rankings"
          :is-comparison-mode="isComparisonMode"
        />
      </div>

      <!-- TARGET VIEW: 2 Charts Side-by-Side -->
      <div v-show="viewMode === 'target' && dashboardData && hasActualData" class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white flex-1 w-full">
        <!-- Revenue Achievement -->
        <div class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100">
          <h3 class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2">
            <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            Tỷ lệ hoàn thành theo Doanh Thu
          </h3>
          <div class="relative w-full h-[380px]">
            <div ref="revChartRef" class="w-full h-full"></div>
          </div>
        </div>

        <!-- Subscribers Achievement -->
        <div class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100">
          <h3 class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2">
            <div class="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            Tỷ lệ hoàn thành theo Thuê Bao
          </h3>
          <div class="relative w-full h-[380px]">
            <div ref="subChartRef" class="w-full h-full"></div>
          </div>
        </div>
      </div>

      <!-- Global Chart Spinner (Common for all modes) -->
      <transition name="fade-fast">
        <div v-if="isProcessing && hasActualData" class="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl pointer-events-none">
          <div class="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
            <div class="w-8 h-8 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
            <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Đang xử lý...</span>
          </div>
        </div>
      </transition>

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
  viewMode,
  availableYears,
  availableMonths,
  availableQuarters,
  productGroups,
  openCompare,
  loadData,
} = useDashboard();

const chartRef = ref(null);
const revChartRef = ref(null);
const subChartRef = ref(null);

const chartInstance = shallowRef(null);
const revChartInstance = shallowRef(null);
const subChartInstance = shallowRef(null);

const hasActualData = computed(() => {
  if (!dashboardData.value) return false;
  
  if (viewMode.value === 'target') {
    return !!(dashboardData.value.targetAchievement && dashboardData.value.targetAchievement.labels?.length > 0);
  }

  // Check actual metrics
  const m = activeMetric.value || "withoutVat";
  if (isComparisonMode.value) {
    const comp = dashboardData.value.comparisonData[m];
    return !!(comp && comp.years?.length > 0);
  }
  
  const chart = dashboardData.value.chartData[m];
  return !!(chart && chart.values?.length > 0);
});

// --- METHODS ---

const initCharts = () => {
  if (viewMode.value === 'actual') {
    // Dispose target charts if switching to actual
    if (revChartInstance.value) { revChartInstance.value.dispose(); revChartInstance.value = null; }
    if (subChartInstance.value) { subChartInstance.value.dispose(); subChartInstance.value = null; }

    if (chartRef.value && !chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value);
      chartInstance.value.setOption(getBaseChartOption());
    }
  } else {
    // Dispose actual chart if switching to target
    if (chartInstance.value) { chartInstance.value.dispose(); chartInstance.value = null; }

    if (revChartRef.value && !revChartInstance.value) {
      revChartInstance.value = echarts.init(revChartRef.value);
    }
    if (subChartRef.value && !subChartInstance.value) {
      subChartInstance.value = echarts.init(subChartRef.value);
    }
  }
  
  window.addEventListener("resize", () => {
    chartInstance.value?.resize();
    revChartInstance.value?.resize();
    subChartInstance.value?.resize();
  });
};

const handleCompareRequest = (config) => {
  suppressFetch.value = true;
  isComparisonMode.value = true;
  filterMode.value = config.mode;
  if (config.mode === "month") {
    selectedMonth.value = config.value;
    selectedQuarter.value = "";
  } else {
    selectedQuarter.value = config.value;
    selectedMonth.value = "";
  }
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
    initCharts();
    if (response) {
      updateUI();
      if (hasActualData.value) {
        setTimeout(() => {
            chartInstance.value?.resize();
            revChartInstance.value?.resize();
            subChartInstance.value?.resize();
        }, 100);
      }
    }
  } catch (e) {
    console.error("Process data failed:", e);
  }
};

const updateUI = () => {
  if (!dashboardData.value) return;

  if (viewMode.value === 'target') {
    renderTargetCharts();
    return;
  }

  if (!chartInstance.value) return;
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

const renderTargetCharts = () => {
  if (!dashboardData.value.targetAchievement) return;
  const data = dashboardData.value.targetAchievement;
  const years = data.years || [];

  const formatValue = (val, type) => {
    if (type === 'revenueRates' || type === 'subRates') return `${val}%`;
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' tỷ';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' tr';
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const createOption = (title, metricType) => {
    const detailType = metricType === 'revenueRates' ? 'revenueDetails' : 'subDetails';
    const yearColors = [
      ['#6366f1', '#4f46e5'], ['#ec4899', '#db2777'], ['#f59e0b', '#d97706'], ['#10b981', '#059669'], ['#06b6d4', '#0891b2'],
    ];

    const series = years.map((y, idx) => {
      const yearRates = data.yearsData[y]?.[metricType] || [];
      const colors = yearColors[idx % yearColors.length];
      
      return {
        name: `Năm ${y}`,
        type: 'bar',
        barGap: '15%',
        barCategoryGap: '30%',
        data: yearRates.map(val => {
          if (years.length === 1) {
            let statusColor = ['#ef4444', '#b91c1c']; 
            if (val >= 100) statusColor = ['#10b981', '#059669'];
            else if (val >= 80) statusColor = ['#f59e0b', '#d97706'];
            return {
              value: val,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: statusColor[0] }, { offset: 1, color: statusColor[1] }
                ])
              }
            };
          }
          return val;
        }),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[0] }, { offset: 1, color: colors[1] }
          ])
        },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
        markLine: idx === 0 ? {
          silent: true, symbol: 'none',
          label: {
            show: true, position: 'end', formatter: 'Đích 100%', fontSize: 9, fontWeight: 'bold',
            color: '#059669', backgroundColor: 'rgba(255,255,255,0.9)', padding: [2, 4], borderRadius: 4
          },
          lineStyle: { type: 'dashed', color: '#10b981', width: 2, opacity: 0.6 },
          data: [{ yAxis: 100 }]
        } : undefined,
        label: {
          show: true, position: 'top', 
          formatter: (p) => { 
            const val = typeof p.value === 'object' ? p.value.value : p.value;
            return val > 0 ? `${val}%` : '';
          },
          fontSize: 8, fontWeight: 'bold', color: '#64748b', distance: 2
        }
      };
    });

    return {
      tooltip: { 
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.98)', borderColor: '#eee', borderWidth: 1,
        padding: [12, 16], extraCssText: 'shadow-xl rounded-xl border-0',
        formatter: (params) => {
            const groupIdx = params[0].dataIndex;
            let res = `<div class="mb-3 pb-2 border-b border-gray-100 flex items-center justify-between gap-6">
                        <span class="text-sm font-black text-gray-800">${params[0].name}</span>
                        <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${title}</span>
                       </div>`;
            params.forEach((p, idx) => {
                const year = years[idx];
                const val = typeof p.value === 'object' ? p.value.value : p.value;
                const details = data.yearsData[year]?.[detailType]?.[groupIdx] || { actual: 0, target: 0 };
                const emoji = val >= 100 ? '✅' : val >= 80 ? '⚠️' : '❌';
                let deltaHtml = '';
                if (years.length > 1 && idx > 0) {
                    const prevP = params[idx-1];
                    const prevVal = typeof prevP.value === 'object' ? prevP.value.value : prevP.value;
                    const diff = (val - prevVal).toFixed(1);
                    deltaHtml = `<span class="text-[9px] ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'} font-bold ml-1">${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff)}%</span>`;
                }
                res += `<div class="mb-3 last:mb-0">
                    <div class="flex items-center justify-between gap-8 mb-0.5">
                        <span class="flex items-center gap-2">
                            <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${p.color}"></span>
                            <span class="text-[12px] font-bold text-gray-700">Năm ${year}</span>
                        </span>
                        <div class="flex items-center">
                            <span class="text-[13px] font-black text-slate-800">${val}%</span>
                            ${deltaHtml} <span class="ml-1.5">${emoji}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-gray-400 font-medium pl-4">
                        <span>Thực tế: <span class="text-gray-600">${formatValue(details.actual)}</span></span>
                        <span class="mx-2 text-gray-200">/</span>
                        <span>Mục tiêu: <span class="text-gray-600">${formatValue(details.target)}</span></span>
                    </div>
                </div>`;
            });
            return res;
        }
      },
      legend: { show: years.length >= 1, top: 0, right: 10, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 11, fontWeight: 'bold', color: '#64748b' } },
      dataZoom: data.labels.length > 4 ? [{ type: 'slider', show: true, bottom: 0, height: 18, fillerColor: 'rgba(99, 102, 241, 0.1)', handleStyle: { color: '#6366f1' }, textStyle: { show: false } }] : [],
      grid: { top: '12%', left: '3%', right: '5%', bottom: data.labels.length > 4 ? '18%' : '15%', containLabel: true },
      xAxis: { 
          type: 'category', data: data.labels, 
          axisLabel: { interval: 0, rotate: 35, fontSize: 10, fontWeight: 'bold', color: '#64748b', overflow: 'break' },
          splitLine: { show: true, lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      yAxis: { 
        type: 'value', max: (v) => v.max > 120 ? v.max + 10 : 120,
        axisLabel: { formatter: (v) => `${v.toFixed(0)}%`, color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        splitArea: { show: true, areaStyle: { color: ['rgba(241,245,249,0.3)', 'rgba(241,245,249,0)'] } }
      },
      series: series
    };
  };

  if (revChartInstance.value) revChartInstance.value.setOption(createOption('Doanh Thu', 'revenueRates'), true);
  if (subChartInstance.value) subChartInstance.value.setOption(createOption('Thuê Bao', 'subRates'), true);
};

// --- LIFECYCLE & WATCHERS ---

onMounted(async () => {
  initCharts();
  loadingStatusText.value = "Đang tải báo cáo...";
  await processData();
  globalLoading.value = false;
});

watch(
  [dataType, sourceType, selectedYear, selectedMonth, selectedQuarter, filterMode, viewMode],
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
