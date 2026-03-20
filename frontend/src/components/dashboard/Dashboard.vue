<template>
  <div
    class="relative max-w-full mx-auto font-sans text-gray-700 sm:p-6 lg:p-8"
  >
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
      :product-groups="visibleProductGroups"
      :is-comparison-mode="isComparisonMode"
      @toggle-compare="isComparisonMode = !isComparisonMode"
    />

    <!-- Main Chart & Ranking Card -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 min-h-[520px] flex flex-col relative"
    >
      <!-- ACTUAL VIEW: Chart + Ranking + Table -->
      <div
        v-show="
          viewMode === 'actual' &&
          dashboardData &&
          hasActualData &&
          !isProcessing
        "
        class="p-8 bg-white flex-1 w-full space-y-12"
      >
        <!-- TOP ROW: Line Chart & Pie Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div
            class="lg:col-span-8 relative bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50"
          >
            <h3
              class="text-[18px] text-gray-800 mb-6 font-black flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                {{
                  isComparisonMode
                    ? isSinglePoint
                      ? `So sánh xu hướng ${activeMetric === "serviceCount" ? "số lượng" : "doanh thu"} ${timeLabel.toLowerCase()} qua các năm`
                      : `Biểu đồ so sánh doanh thu 12 tháng qua các năm`
                    : `${activeMetric === "serviceCount" ? "Số lượng" : "Doanh Thu"} `
                }}
              </div>

              <button
                v-if="isComparisonMode"
                @click="exitComparison"
                class="text-[11px] font-black text-blue-600 hover:bg-blue-600 hover:text-white bg-white px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                Thoát so sánh
              </button>
            </h3>
            <div class="relative w-full h-[420px]">
              <div ref="chartRef" class="w-full h-full"></div>
            </div>
          </div>

          <div class="lg:col-span-4">
            <div
              class="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 h-full flex flex-col"
            >
              <h4
                class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2"
              >
                <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                {{ dataType === "all" ? "Cơ cấu" : "Tỷ trọng đóng góp" }}
                {{ activeMetric === "serviceCount" ? "Số lượng" : "Doanh Thu" }}
                {{
                  dataType === "all"
                    ? selectedYear
                      ? "(Năm " + selectedYear + ")"
                      : "(Tổng cộng)"
                    : "Theo Năm"
                }}
              </h4>
              <div class="relative w-full flex-1 min-h-[420px]">
                <div ref="pieChartRef" class="w-full h-full"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM ROW: Table & Ranking -->
        <div
          class="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-gray-100"
        >
          <div class="lg:col-span-8 space-y-6">
            <div class="flex items-center justify-between">
              <h3
                class="text-[18px] text-gray-800 font-black flex items-center gap-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Chi tiết dữ liệu theo sản phẩm
              </h3>
              <div
                class="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100"
              >
                Đơn vị:
                {{ activeMetric === "serviceCount" ? "Số lượng" : "VNĐ" }}
              </div>
            </div>

            <div
              class="overflow-x-auto rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 max-h-[600px] custom-scrollbar"
            >
              <table class="w-full text-left border-separate border-spacing-0">
                <thead class="sticky top-0 z-20">
                  <tr class="bg-gray-50/90 backdrop-blur-md">
                    <!-- Standard Product Breakdown View -->
                    <template v-if="!isComparisonMode && dataType === 'all'">
                      <th
                        class="p-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 sticky left-0 bg-gray-50 z-30"
                      >
                        Tháng
                      </th>
                      <th
                        v-for="cat in categoryData?.categories || []"
                        :key="cat"
                        class="p-4 text-[10px] font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 text-right min-w-[100px] truncate"
                        :title="cat"
                      >
                        {{ cat }}
                      </th>
                      <th
                        class="p-4 text-[11px] font-black text-blue-700 uppercase tracking-widest border-b border-gray-200 text-right bg-blue-100 sticky right-0 z-30 shadow-[-6px_0_12px_rgba(43,84,255,0.15)] min-w-[120px]"
                      >
                        Tổng tháng
                      </th>
                    </template>

                    <!-- Comparison Matrix View (Vertical: Month, Horizontal: Year) -->
                    <template v-else>
                      <th
                        class="p-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 sticky left-0 bg-gray-50 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.05)]"
                      >
                        Tháng
                      </th>
                      <th
                        v-for="year in comparisonData?.years || []"
                        :key="year"
                        class="p-4 text-right text-[11px] font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 text-right min-w-[120px]"
                      >
                        Năm {{ year }}
                      </th>
                      <th
                        class="p-4 text-[11px] font-black text-blue-700 uppercase tracking-widest border-b border-gray-200 text-right bg-blue-100 sticky right-0 z-30 shadow-[-6px_0_12px_rgba(43,84,255,0.15)] min-w-[140px]"
                      >
                        Tổng tháng
                      </th>
                    </template>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 bg-white">
                  <!-- Case 1: Standard Table -->
                  <template v-if="!isComparisonMode && dataType === 'all'">
                    <tr
                      v-for="(month, idx) in categoryData?.months || []"
                      :key="month"
                      class="hover:bg-blue-50/10 transition-all group"
                    >
                      <td
                        class="p-4 text-[13px] font-black text-gray-600 border-r border-gray-100 sticky left-0 bg-white z-10"
                      >
                        {{ month }}
                      </td>
                      <td
                        v-for="catSeries in categoryData?.series || []"
                        :key="catSeries.name"
                        class="p-4 text-[13px] font-bold text-gray-700 text-right font-mono tracking-tight"
                      >
                        {{ formatValue(catSeries.data[idx]) }}
                      </td>
                      <td
                        class="p-4 text-[13px] font-black text-blue-800 text-right bg-blue-50 sticky right-0 z-10 font-mono shadow-[-6px_0_12px_rgba(43,84,255,0.08)] group-hover:bg-blue-100"
                      >
                        {{ formatValue(calculateMonthTotal(idx)) }}
                      </td>
                    </tr>
                  </template>

                  <!-- Case 2: Comparison Matrix Table (Month as Row) -->
                  <template v-else>
                    <tr
                      v-for="(label, lIdx) in comparisonData?.labels || []"
                      :key="lIdx"
                      class="hover:bg-blue-50/10 transition-all group"
                    >
                      <td
                        class="p-4 text-[13px] font-black text-slate-800 border-r border-gray-100 sticky left-0 bg-white z-10 shadow-[4px_0_8px_rgba(0,0,0,0.02)]"
                      >
                        {{ label }}
                      </td>
                      <td
                        v-for="year in comparisonData?.years || []"
                        :key="year"
                        class="p-4 text-[13px] font-bold text-gray-600 text-right font-mono tracking-tight"
                      >
                        {{ formatValue(comparisonData?.yearData[year][lIdx]) }}
                      </td>
                      <td
                        class="p-4 text-[14px] font-black text-blue-800 text-right bg-white sticky right-0 z-10 font-mono shadow-[-6px_0_12px_rgba(43,84,255,0.12)] group-hover:bg-blue-50"
                      >
                        {{ formatValue(calculateMonthTotalAcrossYears(lIdx)) }}
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot class="sticky bottom-0 z-20">
                  <tr
                    class="bg-slate-900 text-white shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
                  >
                    <template v-if="dataType === 'all' && !isComparisonMode">
                      <td
                        class="p-3 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-slate-800 rounded-bl-3xl"
                      >
                        TỔNG NĂM
                      </td>
                      <td
                        v-for="catSeries in categoryData?.series || []"
                        :key="catSeries.name"
                        class="p-3 text-[12px] text-right font-mono font-black text-blue-300 max-w-[110px] truncate"
                        :title="catSeries.name"
                      >
                        {{
                          formatValue(calculateCategoryTotal(catSeries.data))
                        }}
                      </td>
                      <td
                        class="p-4 text-[14px] text-right bg-blue-600 font-mono font-black text-white sticky right-0 z-10 shadow-[-4px_0_12px_rgba(43,84,255,0.2)] rounded-br-3xl"
                      >
                        {{ formatValue(calculateGrandTotal()) }}
                      </td>
                    </template>
                    <template v-else>
                      <td
                        class="p-3 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-slate-800 rounded-bl-3xl"
                      >
                        TỔNG NĂM
                      </td>
                      <td
                        v-for="year in comparisonData?.years || []"
                        :key="year"
                        class="p-3 text-[12px] text-right font-mono font-black text-blue-300 min-w-[120px]"
                      >
                        {{ formatValue(calculateYearTotal(year)) }}
                      </td>
                      <td
                        class="p-3 text-[13px] text-right bg-blue-600 font-mono font-black text-white sticky right-0 z-10 shadow-[-4px_0_12px_rgba(43,84,255,0.2)] rounded-br-3xl"
                      >
                        {{ formatValue(calculateGrandTotalAcrossYears()) }}
                      </td>
                    </template>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="lg:col-span-4">
            <StaffRanking
              :rankings="rankings"
              :is-comparison-mode="isComparisonMode"
            />
          </div>
        </div>
      </div>

      <!-- TARGET VIEW: 2 Charts Side-by-Side -->
      <div
        v-show="
          viewMode === 'target' &&
          dashboardData &&
          hasActualData &&
          !isProcessing
        "
        class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white flex-1 w-full"
      >
        <!-- Revenue Achievement -->
        <div
          class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100 flex flex-col"
        >
          <h3
            class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2"
          >
            <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            Tỷ lệ hoàn thành theo Doanh Thu
          </h3>
          <div class="relative w-full flex-1 min-h-[380px]">
            <div
              v-show="hasRevenueTargetData"
              ref="revChartRef"
              class="w-full h-full"
            ></div>
            <EmptyData
              v-if="!hasRevenueTargetData"
              title="Không có dữ liệu DT"
              message="Chưa có thông tin chỉ tiêu hoặc doanh thu cho mục này."
              class="scale-75"
            />
          </div>
        </div>

        <!-- Subscribers Achievement -->
        <div
          class="relative bg-gray-50/30 p-4 rounded-2xl border border-gray-100 flex flex-col"
        >
          <h3
            class="text-[14px] font-black text-gray-700 mb-6 uppercase tracking-wider flex items-center gap-2"
          >
            <div class="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            Tỷ lệ hoàn thành theo Thuê Bao
          </h3>
          <div class="relative w-full flex-1 min-h-[380px]">
            <div
              v-show="hasSubTargetData"
              ref="subChartRef"
              class="w-full h-full"
            ></div>
            <EmptyData
              v-if="!hasSubTargetData"
              title="Không có dữ liệu TB"
              message="Chưa có thông tin chỉ tiêu hoặc thuê bao cho mục này."
              class="scale-75"
            />
          </div>
        </div>
      </div>

      <!-- Global Chart Spinner (Common for all modes) -->
      <transition name="fade-fast">
        <div
          v-if="isProcessing || globalLoading"
          class="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-[40] rounded-2xl pointer-events-none"
        >
          <div
            class="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-gray-100"
          >
            <div
              class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"
            ></div>
            <span
              class="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]"
              >Đang xử lý...</span
            >
          </div>
        </div>
      </transition>

      <!-- Empty State -->
      <EmptyData
        v-if="dashboardData && !hasActualData && !isProcessing"
        class="absolute inset-0 z-20 bg-gray-50/50"
      />
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
  nextTick,
  computed,
} from "vue";
import * as echarts from "echarts";

// Composables & Helpers
import { useDashboard } from "../../composables/useDashboard";
import {
  getBaseChartOption,
  getUpdateOption,
  getComparisonOption,
  getCategoryLineOption,
  getCategoryPieOption,
} from "../../utils/chartConfig";

// Components
import LoadingOverlay from "../common/LoadingOverlay.vue";
import EmptyData from "../common/EmptyData.vue";
import DashboardFilters from "./DashboardFilters.vue";
import StaffRanking from "./StaffRanking.vue";

// --- CONFIG ---
const metrics = [
  { id: "withoutVat", name: "Doanh thu (Chưa VAT)" },
  { id: "serviceCount", name: "Số lượng" },
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
const pieChartRef = ref(null);
const revChartRef = ref(null);
const subChartRef = ref(null);

const chartInstance = shallowRef(null);
const pieChartInstance = shallowRef(null);
const revChartInstance = shallowRef(null);
const subChartInstance = shallowRef(null);

const hasRevenueTargetData = computed(() => {
  if (!dashboardData.value?.targetAchievement) return false;
  const data = dashboardData.value.targetAchievement;
  const years = data.years || [];
  return years.some((y) =>
    (data.yearsData[y]?.revenueRates || []).some((v) => v > 0),
  );
});

const hasSubTargetData = computed(() => {
  if (!dashboardData.value?.targetAchievement) return false;
  const data = dashboardData.value.targetAchievement;
  const years = data.years || [];
  return years.some((y) =>
    (data.yearsData[y]?.subRates || []).some((v) => v > 0),
  );
});

const hasActualData = computed(() => {
  if (!dashboardData.value) return false;

  if (viewMode.value === "target") {
    return hasRevenueTargetData.value || hasSubTargetData.value;
  }

  // Check actual metrics
  const m = activeMetric.value || "withoutVat";
  if (isComparisonMode.value) {
    const comp = dashboardData.value.comparisonData[m];
    if (!comp || !comp.years || comp.years.length === 0) return false;
    return comp.years.some((y) => (comp.yearData[y] || []).some((v) => v > 0));
  }

  const catData = dashboardData.value.categoryData?.[m];
  return !!(catData && catData.series?.some((s) => s.data.some((v) => v > 0)));
});

const categoryData = computed(() => {
  if (!dashboardData.value || !dashboardData.value.categoryData) return null;
  return dashboardData.value.categoryData[activeMetric.value];
});

const comparisonData = computed(() => {
  if (!dashboardData.value || !dashboardData.value.comparisonData) return null;
  return dashboardData.value.comparisonData[activeMetric.value];
});

const lastVisibleGroups = ref(["all"]);

// Filter product groups to hide those with 0 data (except 'all')
const visibleProductGroups = computed(() => {
  if (!productGroups.value) return ["all"];

  // If we are looking at "all", compute which ones have data and update the lastKnown list
  if (
    dataType.value === "all" &&
    dashboardData.value &&
    dashboardData.value.categoryData &&
    dashboardData.value.categoryData[activeMetric.value]
  ) {
    const currentData = dashboardData.value.categoryData[activeMetric.value];
    if (currentData.series) {
      const activeNames = currentData.series
        .filter((s) => s.data && s.data.some((val) => val > 0))
        .map((s) => s.name);

      // PURE DATA-DRIVEN: Only show categories that actually appear in the chart + "all"
      const filtered = Array.from(new Set(["all", ...activeNames]));

      // Sort to keep 'all' first, then others alphabetically
      lastVisibleGroups.value = filtered.sort((a, b) => {
        if (a === "all") return -1;
        if (b === "all") return 1;
        return a.localeCompare(b);
      });
    }
  }

  // Always return the last known good set of tabs to prevent them from disappearing
  return lastVisibleGroups.value;
});

// --- METHODS ---

const initCharts = () => {
  if (viewMode.value === "actual") {
    // Dispose target charts if switching to actual
    if (revChartInstance.value) {
      revChartInstance.value.dispose();
      revChartInstance.value = null;
    }
    if (subChartInstance.value) {
      subChartInstance.value.dispose();
      subChartInstance.value = null;
    }

    if (chartRef.value && !chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value);
    }
    if (pieChartRef.value && !pieChartInstance.value) {
      pieChartInstance.value = echarts.init(pieChartRef.value);
    }
  } else {
    // Dispose actual chart if switching to target
    if (chartInstance.value) {
      chartInstance.value.dispose();
      chartInstance.value = null;
    }
    if (pieChartInstance.value) {
      pieChartInstance.value.dispose();
      pieChartInstance.value = null;
    }

    if (revChartRef.value && !revChartInstance.value) {
      revChartInstance.value = echarts.init(revChartRef.value);
    }
    if (subChartRef.value && !subChartInstance.value) {
      subChartInstance.value = echarts.init(subChartRef.value);
    }
  }
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
    isProcessing.value = true;
    await processData();
  });
};

const exitComparison = async () => {
  isComparisonMode.value = false;
  isProcessing.value = true;
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
          pieChartInstance.value?.resize();
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

  if (viewMode.value === "target") {
    renderTargetCharts();
    return;
  }

  if (!chartInstance.value) return;
  const metricObj = metrics.find((m) => m.id === activeMetric.value);
  const metricName = metricObj?.name || "Doanh thu";

  // Handle special case: SINGLE month or quarter selected -> Swap axis to show meaningful lines
  // Handle special case: SINGLE point selected (1 Month, 1 Quarter, or 1 Year in Comparison)
  const isSinglePoint =
    isComparisonMode.value &&
    (filterMode.value === "month" || filterMode.value === "quarter");

  let timeLabel = "";
  if (filterMode.value === "month") timeLabel = `Tháng ${selectedMonth.value}`;
  else if (filterMode.value === "quarter")
    timeLabel = `Quý ${selectedQuarter.value}`;
  else if (filterMode.value === "all") timeLabel = "Cả năm";

  const comp = dashboardData.value.comparisonData?.[activeMetric.value];
  const cat = dashboardData.value.categoryData?.[activeMetric.value];

  if (isSinglePoint && comp && cat) {
    // Trend across YEARS for a specific time slice (Year, Quarter or Month)
    const transformedData = {
      labels: comp.years.map((y) => `Năm ${y}`),
      years: [timeLabel],
      yearData: {
        [timeLabel]: comp.years.map((y) => {
          if (filterMode.value === "all") {
            // Sum all months for the annual trend
            const monthsData = comp.yearData[y] || [];
            return monthsData.reduce((sum, val) => sum + (val || 0), 0);
          }
          // For single month/quarter, backend already returns the slice as index 0
          return comp.yearData[y][0] || 0;
        }),
      },
    };
    chartInstance.value.setOption(
      getComparisonOption(transformedData, metricName, activeMetric.value),
      true,
    );
  } else if (isComparisonMode.value) {
    if (comp && chartInstance.value) {
      // Filter years that have all 0 data
      const activeYears = comp.years.filter((y) =>
        comp.yearData[y].some((v) => v > 0),
      );
      const filteredComp = {
        ...comp,
        years: activeYears,
      };
      chartInstance.value.setOption(
        getComparisonOption(filteredComp, metricName, activeMetric.value),
        true,
      );
    }
  } else {
    // Normal View Logic
    if (cat && chartInstance.value) {
      // Automatic switch to multi-year comparison if specific product selected
      if (
        dataType.value !== "all" &&
        comp &&
        comp.years &&
        comp.years.length > 0
      ) {
        chartInstance.value.setOption(
          getComparisonOption(comp, metricName, activeMetric.value),
          true,
        );
      } else {
        // Standard view: filter series with 0 data
        const filteredCat = {
          ...cat,
          series: cat.series.filter((s) => s.data.some((v) => v > 0)),
        };
        chartInstance.value.setOption(
          getCategoryLineOption(filteredCat, metricName, activeMetric.value),
          true,
        );
      }
    }
  }

  // Common Pie Chart Update
  if (pieChartInstance.value && cat) {
    let pieData = cat.pieData || [];

    // If specific category is selected, show breakdown by year instead of by products
    if (
      dataType.value !== "all" &&
      comp &&
      comp.years &&
      comp.years.length > 0
    ) {
      pieData = comp.years
        .map((y) => ({
          name: `Năm ${y}`,
          value: comp.yearData[y].reduce((sum, v) => sum + (v || 0), 0),
        }))
        .filter((item) => item.value > 0);
    }

    pieChartInstance.value.setOption(
      getCategoryPieOption(pieData, metricName, activeMetric.value),
      true,
    );
  }
};

const formatValue = (val) => {
  if (val === undefined || val === null) return "0";
  if (activeMetric.value === "serviceCount") return val.toLocaleString("vi-VN");

  if (val >= 1000000000) return (val / 1000000000).toFixed(2) + " tỷ";
  if (val >= 1000000) return (val / 1000000).toFixed(1) + " tr";
  return val.toLocaleString("vi-VN");
};

const calculateMonthTotal = (monthIdx) => {
  if (!categoryData.value) return 0;
  return categoryData.value.series.reduce(
    (sum, s) => sum + (s.data[monthIdx] || 0),
    0,
  );
};

const calculateCategoryTotal = (records) => {
  return records.reduce((sum, v) => sum + v, 0);
};

const calculateGrandTotal = () => {
  if (!categoryData.value) return 0;
  return categoryData.value.series.reduce(
    (sum, s) => sum + calculateCategoryTotal(s.data),
    0,
  );
};

const calculateYearTotal = (year) => {
  const data = comparisonData.value?.yearData?.[year];
  if (!data) return 0;
  return data.reduce((sum, v) => sum + (v || 0), 0);
};

const calculateMonthTotalAcrossYears = (monthIdx) => {
  const comp = comparisonData.value;
  if (!comp) return 0;
  return comp.years.reduce(
    (sum, y) => sum + (comp.yearData[y][monthIdx] || 0),
    0,
  );
};

const calculateGrandTotalAcrossYears = () => {
  const comp = comparisonData.value;
  if (!comp) return 0;
  return comp.years.reduce((sum, y) => sum + calculateYearTotal(y), 0);
};

const renderTargetCharts = () => {
  if (!dashboardData.value.targetAchievement) return;
  const data = dashboardData.value.targetAchievement;
  const years = data.years || [];

  const formatValue = (val, type) => {
    if (type === "revenueRates" || type === "subRates") return `${val}%`;
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + " tỷ";
    if (val >= 1000000) return (val / 1000000).toFixed(1) + " tr";
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const createOption = (title, metricType) => {
    const detailType =
      metricType === "revenueRates" ? "revenueDetails" : "subDetails";
    const yearColors = [
      ["#6366f1", "#4f46e5"],
      ["#ec4899", "#db2777"],
      ["#f59e0b", "#d97706"],
      ["#10b981", "#059669"],
      ["#06b6d4", "#0891b2"],
    ];

    const series = years.map((y, idx) => {
      const yearRates = data.yearsData[y]?.[metricType] || [];
      const colors = yearColors[idx % yearColors.length];

      return {
        name: `Năm ${y}`,
        type: "bar",
        barGap: "15%",
        barCategoryGap: "30%",
        data: yearRates.map((val) => {
          if (years.length === 1) {
            let statusColor = ["#ef4444", "#b91c1c"];
            if (val >= 100) statusColor = ["#10b981", "#059669"];
            else if (val >= 80) statusColor = ["#f59e0b", "#d97706"];
            return {
              value: val,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: statusColor[0] },
                  { offset: 1, color: statusColor[1] },
                ]),
              },
            };
          }
          return val;
        }),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[0] },
            { offset: 1, color: colors[1] },
          ]),
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.2)" },
        },
        markLine:
          idx === 0
            ? {
                silent: true,
                symbol: "none",
                label: {
                  show: true,
                  position: "end",
                  formatter: "Đích 100%",
                  fontSize: 9,
                  fontWeight: "bold",
                  color: "#059669",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  padding: [2, 4],
                  borderRadius: 4,
                },
                lineStyle: {
                  type: "dashed",
                  color: "#10b981",
                  width: 2,
                  opacity: 0.6,
                },
                data: [{ yAxis: 100 }],
              }
            : undefined,
        label: {
          show: true,
          position: "top",
          formatter: (p) => {
            const val = typeof p.value === "object" ? p.value.value : p.value;
            return val > 0 ? `${val}%` : "";
          },
          fontSize: 8,
          fontWeight: "bold",
          color: "#64748b",
          distance: 2,
        },
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "#eee",
        borderWidth: 1,
        padding: [12, 16],
        extraCssText: "shadow-xl rounded-xl border-0",
        formatter: (params) => {
          const groupIdx = params[0].dataIndex;
          let res = `<div class="mb-3 pb-2 border-b border-gray-100 flex items-center justify-between gap-6">
                        <span class="text-sm font-black text-gray-800">${params[0].name}</span>
                        <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${title}</span>
                       </div>`;
          params.forEach((p, idx) => {
            const year = years[idx];
            const val = typeof p.value === "object" ? p.value.value : p.value;
            const details = data.yearsData[year]?.[detailType]?.[groupIdx] || {
              actual: 0,
              target: 0,
            };
            const emoji = val >= 100 ? "✅" : val >= 80 ? "⚠️" : "❌";
            let deltaHtml = "";
            if (years.length > 1 && idx > 0) {
              const prevP = params[idx - 1];
              const prevVal =
                typeof prevP.value === "object"
                  ? prevP.value.value
                  : prevP.value;
              const diff = (val - prevVal).toFixed(1);
              deltaHtml = `<span class="text-[9px] ${diff >= 0 ? "text-emerald-500" : "text-red-500"} font-bold ml-1">${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff)}%</span>`;
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
        },
      },
      legend: {
        show: years.length >= 1,
        top: 0,
        right: 10,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 11, fontWeight: "bold", color: "#64748b" },
      },
      dataZoom:
        data.labels.length > 4
          ? [
              {
                type: "slider",
                show: true,
                bottom: 0,
                height: 18,
                fillerColor: "rgba(99, 102, 241, 0.1)",
                handleStyle: { color: "#6366f1" },
                textStyle: { show: false },
              },
            ]
          : [],
      grid: {
        top: "12%",
        left: "3%",
        right: "5%",
        bottom: data.labels.length > 4 ? "18%" : "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.labels,
        axisLabel: {
          interval: 0,
          rotate: 35,
          fontSize: 10,
          fontWeight: "bold",
          color: "#64748b",
          overflow: "break",
        },
        splitLine: {
          show: true,
          lineStyle: { color: "#f1f5f9", type: "dashed" },
        },
      },
      yAxis: {
        type: "value",
        max: (v) => (v.max > 120 ? v.max + 10 : 120),
        axisLabel: {
          formatter: (v) => `${v.toFixed(0)}%`,
          color: "#94a3b8",
          fontSize: 10,
        },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
        splitArea: {
          show: true,
          areaStyle: {
            color: ["rgba(241,245,249,0.3)", "rgba(241,245,249,0)"],
          },
        },
      },
      series: series,
    };
  };

  if (revChartInstance.value)
    revChartInstance.value.setOption(
      createOption("Doanh Thu", "revenueRates"),
      true,
    );
  if (subChartInstance.value)
    subChartInstance.value.setOption(
      createOption("Thuê Bao", "subRates"),
      true,
    );
};

// --- LIFECYCLE & WATCHERS ---

let resizeObserver = null;
const handleGlobalResize = () => {
  chartInstance.value?.resize();
  pieChartInstance.value?.resize();
  revChartInstance.value?.resize();
  subChartInstance.value?.resize();
};

onMounted(async () => {
  initCharts();

  // Initialize ResizeObserver for all chart containers
  resizeObserver = new ResizeObserver(handleGlobalResize);
  [chartRef, pieChartRef, revChartRef, subChartRef].forEach((r) => {
    if (r.value) resizeObserver.observe(r.value);
  });

  window.addEventListener("resize", handleGlobalResize);

  loadingStatusText.value = "Đang tải báo cáo...";
  await processData();
  globalLoading.value = false;
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener("resize", handleGlobalResize);
});

watch(
  [
    dataType,
    sourceType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    filterMode,
    viewMode,
    isComparisonMode,
  ],
  () => {
    if (!suppressFetch.value) {
      isProcessing.value = true;
      processData();
    }
  },
);

watch(activeMetric, updateUI);

// Reset category to 'all' if the current category is hidden (has 0 data)
watch(visibleProductGroups, (newVisible) => {
  if (!newVisible.includes(dataType.value)) {
    dataType.value = "all";
  }
});
</script>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.3s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
