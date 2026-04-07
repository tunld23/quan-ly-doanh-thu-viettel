<template>
  <div class="relative max-w-full mx-auto font-sans text-gray-700 sm:p-6 lg:p-8">
    <LoadingOverlay :show="globalLoading" :status-text="loadingStatusText" />

    <!-- Filters Section -->
    <DashboardFilters
      v-model:dataType="dataType" v-model:sourceType="sourceType" v-model:activeMetric="activeMetric"
      v-model:selectedYear="selectedYear" v-model:filterMode="filterMode" v-model:viewMode="viewMode"
      v-model:selectedMonth="selectedMonth" v-model:selectedQuarter="selectedQuarter"
      :available-years="availableYears" :available-months="availableMonths" :available-quarters="availableQuarters"
      :metrics="metrics" :product-groups="visibleProductGroups" :is-comparison-mode="isComparisonMode"
      @toggle-compare="isComparisonMode = !isComparisonMode" @refresh="handleRefresh"
    />

    <!-- Main Chart & Ranking Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 min-h-[520px] flex flex-col relative">
      <!-- ACTUAL VIEW -->
      <div v-show="((viewMode === 'actual' || viewMode === 'subscriber') && dashboardData && hasActualData && !isProcessing)" class="p-8 bg-white flex-1 w-full space-y-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <!-- Left Column: Table -->
          <div class="lg:col-span-8 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-[18px] text-gray-800 font-black flex items-center gap-3">
                <div class="w-1.5 h-6 bg-emerald-500 rounded-full"></div> Chi tiết dữ liệu theo sản phẩm
              </h3>
              <div class="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Đơn vị: {{ activeMetric === "serviceCount" ? "Số lượng" : "VNĐ" }}
              </div>
            </div>

            <DashboardMainTable
              :dataType="dataType" :isComparisonMode="isComparisonMode" :categoryData="categoryData"
              :comparisonData="comparisonData" :viewMode="viewMode" :activeMetric="activeMetric"
              :calculateMonthTotal="calculateMonthTotal" :calculateMonthTotalAcrossYears="calculateMonthTotalAcrossYears"
              :calculateCategoryTotal="calculateCategoryTotal" :calculateGrandTotal="calculateGrandTotal"
              :calculateYearTotal="calculateYearTotal" :calculateGrandTotalAcrossYears="calculateGrandTotalAcrossYears"
              :formatValue="formatValue"
            />
          </div>

          <!-- Right Column: Ranking -->
          <div class="lg:col-span-4">
            <StaffRanking :rankings="rankings" :is-comparison-mode="isComparisonMode" />
          </div>
        </div>

        <!-- Charts Section -->
        <DashboardChartSection
          :isComparisonMode="isComparisonMode" :isSinglePoint="isSinglePoint" :timeLabel="timeLabel"
          :activeMetric="activeMetric" :viewMode="viewMode" :dataType="dataType"
          :selectedYear="selectedYear" 
          @chart-ready="chartInstance = $event"
          @pie-ready="pieChartInstance = $event"
          @exit-comparison="exitComparison"
        />
      </div>

      <!-- TARGET VIEW -->
      <TargetAchievementSection
        v-show="(viewMode === 'target' && dashboardData && hasActualData && !isProcessing)"
        :hasRevenueTargetData="hasRevenueTargetData" :hasSubTargetData="hasSubTargetData"
        @rev-chart-ready="revChartInstance = $event"
        @sub-chart-ready="subChartInstance = $event"
      />

      <transition name="fade-fast">
        <div v-if="isProcessing || globalLoading" class="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-[40] rounded-2xl pointer-events-none">
          <div class="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
            <div class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Đang xử lý...</span>
          </div>
        </div>
      </transition>

      <EmptyData v-if="dashboardData && !hasActualData && !isProcessing" class="absolute inset-0 z-20 bg-gray-50/50" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, watch, nextTick, computed } from "vue";
import * as echarts from "echarts";

// Composables & Utils
import { useDashboard } from "../../composables/useDashboard";
import { getUpdateOption, getComparisonOption, getCategoryLineOption, getCategoryPieOption } from "../../utils/chartConfig";

// Components
import LoadingOverlay from "../common/LoadingOverlay.vue";
import EmptyData from "../common/EmptyData.vue";
import DashboardFilters from "./DashboardFilters.vue";
import StaffRanking from "./StaffRanking.vue";
import DashboardMainTable from "./DashboardMainTable.vue";
import DashboardChartSection from "./DashboardChartSection.vue";
import TargetAchievementSection from "./TargetAchievementSection.vue";

// --- STATE ---
const {
  suppressFetch, dashboardData, rankings, isProcessing, globalLoading, loadingStatusText,
  activeMetric, dataType, sourceType, selectedYear, selectedMonth, selectedQuarter, filterMode,
  isComparisonMode, viewMode, availableYears, availableMonths, availableQuarters, productGroups, loadData,
} = useDashboard();

const metrics = [
  { id: "withoutVat", name: "Doanh thu (Chưa VAT)" },
  { id: "serviceCount", name: "Số lượng" },
];

const chartInstance = shallowRef(null);
const pieChartInstance = shallowRef(null);
const revChartInstance = shallowRef(null);
const subChartInstance = shallowRef(null);

// --- COMPUTED ---
const hasRevenueTargetData = computed(() => {
  const data = dashboardData.value?.targetAchievement;
  return data?.years?.some(y => (data.yearsData[y]?.revenueRates || []).some(v => v > 0));
});

const hasSubTargetData = computed(() => {
  const data = dashboardData.value?.targetAchievement;
  return data?.years?.some(y => (data.yearsData[y]?.subRates || []).some(v => v > 0));
});

const hasActualData = computed(() => {
  if (!dashboardData.value) return false;
  if (viewMode.value === "target") return hasRevenueTargetData.value || hasSubTargetData.value;
  
  const m = viewMode.value === "subscriber" ? "serviceCount" : activeMetric.value || "withoutVat";
  if (isComparisonMode.value) {
    const comp = dashboardData.value.comparisonData?.[m];
    return comp?.years?.some(y => (comp.yearData[y] || []).some(v => v > 0));
  }
  const catData = dashboardData.value.categoryData?.[m];
  return !!(catData && catData.series?.some(s => s.data.some(v => v > 0)));
});

const categoryData = computed(() => dashboardData.value?.categoryData?.[activeMetric.value]);
const comparisonData = computed(() => dashboardData.value?.comparisonData?.[activeMetric.value]);
const visibleProductGroups = computed(() => productGroups.value || ["all"]);

const isSinglePoint = computed(() => isComparisonMode.value && (selectedMonth.value !== "" || selectedQuarter.value !== ""));
const timeLabel = computed(() => {
  if (filterMode.value === "month") return `Tháng ${selectedMonth.value}`;
  if (filterMode.value === "quarter") return `Quý ${selectedQuarter.value}`;
  return "Cả năm";
});

// --- WATCHES ---
watch([dataType, sourceType, selectedYear, activeMetric, viewMode, filterMode, selectedMonth, selectedQuarter], () => {
    if (!suppressFetch.value) {
      if (viewMode.value === "subscriber" && activeMetric.value !== "serviceCount") activeMetric.value = "serviceCount";
      else if (viewMode.value === "actual" && activeMetric.value === "serviceCount") activeMetric.value = "withoutVat";
      processData();
    }
});

// --- METHODS ---
const exitComparison = async () => { isComparisonMode.value = false; await processData(); };

const handleRefresh = async () => {
  const { useToast } = await import("../../composables/useToast");
  const toast = useToast();
  globalLoading.value = true;
  loadingStatusText.value = "Đang đồng bộ lại dữ liệu...";
  try {
    const { dashboardService } = await import("../../services/apiService");
    await dashboardService.refreshDashboard();
    toast.success("Dữ liệu đã được đồng bộ lại!");
    await processData();
  } catch (e) {
    toast.error("Lỗi đồng bộ dữ liệu: " + (e.response?.data?.error || e.message));
  } finally { globalLoading.value = false; }
};

const processData = async () => {
  try {
    const response = await loadData();
    await nextTick();
    if (response) { updateUI(); }
  } catch (e) { console.error("Process data failed:", e); }
};

const updateUI = () => {
  if (!dashboardData.value) return;
  if (viewMode.value === "target") { renderTargetCharts(); return; }
  
  const metricName = metrics.find(m => m.id === activeMetric.value)?.name || "Doanh thu";
  const comp = dashboardData.value.comparisonData?.[activeMetric.value];
  const cat = dashboardData.value.categoryData?.[activeMetric.value];

  if (isSinglePoint.value && comp && cat) {
     const transformed = {
       labels: comp.years.map(y => `Năm ${y}`),
       years: [timeLabel.value],
       yearData: { [timeLabel.value]: comp.years.map(y => filterMode.value === "all" ? (comp.yearData[y] || []).reduce((a,b)=>a+(b||0),0) : comp.yearData[y][0] || 0) }
     };
     chartInstance.value?.setOption(getComparisonOption(transformed, metricName, activeMetric.value), true);
  } else if (isComparisonMode.value && comp) {
     const filtered = { ...comp, years: comp.years.filter(y => comp.yearData[y].some(v => v > 0)) };
     chartInstance.value?.setOption(getComparisonOption(filtered, metricName, activeMetric.value), true);
  } else if (cat) {
     if (viewMode.value !== "subscriber" && dataType.value !== "all" && comp?.years?.length > 0) {
       chartInstance.value?.setOption(getComparisonOption(comp, metricName, activeMetric.value), true);
     } else {
       const filteredCat = { ...cat, series: cat.series.filter(s => s.data.some(v => v > 0)) };
       chartInstance.value?.setOption(getCategoryLineOption(filteredCat, metricName, activeMetric.value), true);
     }
  }

  if (pieChartInstance.value && cat) {
    let pieData = cat.pieData || [];
    if (viewMode.value !== "subscriber" && (dataType.value !== "all" || isComparisonMode.value) && comp?.years?.length > 0) {
      pieData = comp.years.map(y => ({ name: `Năm ${y}`, value: comp.yearData[y].reduce((s, v) => s + (v || 0), 0) })).filter(i => i.value > 0);
    }
    pieChartInstance.value.setOption(getCategoryPieOption(pieData, metricName, activeMetric.value), true);
  }
};

const renderTargetCharts = () => {
    const data = dashboardData.value.targetAchievement;
    if (!data) return;
    const commonOpt = {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => {
          let str = `<div class='p-2 font-black text-gray-700'>${p[0].name}</div>`;
          p.forEach(s => {
            const y = data.years[s.componentIndex % data.years.length];
            const details = s.seriesName.includes("Doanh Thu") ? data.yearsData[y].revenueDetails[s.dataIndex] : data.yearsData[y].subDetails[s.dataIndex];
            str += `<div class='flex items-center justify-between gap-6 px-2 py-1 border-t border-gray-100'>
                      <span class='text-[11px] font-bold text-gray-500 uppercase'>${s.seriesName}</span>
                      <span class='font-black' style='color:${s.color}'>${s.value}%</span>
                    </div>
                    <div class='bg-gray-50 p-2 rounded-lg mt-1 text-[10px] space-y-1'>
                      <div class='flex justify-between'><span>Thực tế:</span><span class='font-bold'>${(details.actual || 0).toLocaleString()}</span></div>
                      <div class='flex justify-between'><span>Mục tiêu:</span><span class='font-bold'>${(details.target || 0).toLocaleString()}</span></div>
                    </div>`;
          });
          return str;
      }},
      legend: { bottom: 0, icon: "circle", itemWidth: 8, textStyle: { fontWeight: "bold", fontSize: 10 } },
      grid: { top: "10%", left: "3%", right: "4%", bottom: "15%", containLabel: true }
    };

    if (revChartInstance.value && hasRevenueTargetData.value) {
      revChartInstance.value.setOption({ ...commonOpt, xAxis: { type: "category", data: data.labels, axisLabel: { interval: 0, rotate: 30, fontSize: 10, fontWeight: "bold" } }, yAxis: { type: "value", axisLabel: { formatter: "{value}%" } }, series: data.years.map(y => ({ name: `Năm ${y}`, type: "bar", barWidth: "20%", data: data.yearsData[y].revenueRates, label: { show: true, position: "top", formatter: "{c}%", fontSize: 9, fontWeight: "bold" } })) }, true);
    }
    if (subChartInstance.value && hasSubTargetData.value) {
      subChartInstance.value.setOption({ ...commonOpt, xAxis: { type: "category", data: data.labels, axisLabel: { interval: 0, rotate: 30, fontSize: 10, fontWeight: "bold" } }, yAxis: { type: "value", axisLabel: { formatter: "{value}%" } }, series: data.years.map(y => ({ name: `Năm ${y}`, type: "bar", barWidth: "20%", data: data.yearsData[y].subRates, label: { show: true, position: "top", formatter: "{c}%", fontSize: 9, fontWeight: "bold" } })) }, true);
    }
};

// --- TABLE HELPERS ---
const calculateMonthTotal = (mIdx) => categoryData.value?.series?.reduce((sum, s) => sum + (s.data[mIdx] || 0), 0) || 0;
const calculateMonthTotalAcrossYears = (lIdx) => comparisonData.value?.years?.reduce((sum, y) => sum + (comparisonData.value?.yearData[y][lIdx] || 0), 0) || 0;
const calculateCategoryTotal = (data) => data.reduce((sum, val) => sum + (val || 0), 0);
const calculateGrandTotal = () => categoryData.value?.series?.reduce((sum, s) => sum + calculateCategoryTotal(s.data), 0) || 0;
const calculateYearTotal = (year) => comparisonData.value?.yearData[year]?.reduce((sum, val) => sum + (val || 0), 0) || 0;
const calculateGrandTotalAcrossYears = () => comparisonData.value?.years?.reduce((sum, y) => sum + calculateYearTotal(y), 0) || 0;
const formatValue = (val) => {
  if (val === undefined || val === null || val === 0) return "-";
  if (activeMetric.value === "serviceCount") return val.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 6 });
  return (val / 1000000).toLocaleString("en-US", { useGrouping: true, maximumFractionDigits: 1 });
};

onMounted(processData);
</script>
