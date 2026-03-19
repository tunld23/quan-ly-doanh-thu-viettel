import { ref, computed, nextTick, watch } from "vue";
import { dashboardService } from "../services/apiService";
import { useToast } from "./useToast";

/**
 * Composable to manage Dashboard state and logic
 */
export function useDashboard() {
  const isProcessing = ref(false);
  const globalLoading = ref(false);
  const loadingStatusText = ref("Đang kết nối Server...");
  const showCompareModal = ref(false);
  const suppressFetch = ref(false);
  const toast = useToast();

  const dashboardData = ref(null);
  const rankings = ref([]);
  const productGroups = ref(["all"]);
  const availableYearsFromDb = ref([]);
  const availableMonthsFromDb = ref([]);
  const availableQuartersFromDb = ref([]);

  const activeMetric = ref("withoutVat");
  const dataType = ref("all");
  const sourceType = ref("all");
  const selectedYear = ref("");
  const selectedMonth = ref("");
  const selectedQuarter = ref("");
  const filterMode = ref("all");
  const isComparisonMode = ref(false);
  const viewMode = ref("actual");

  const availableYears = computed(() => availableYearsFromDb.value);
  const availableMonths = computed(() => availableMonthsFromDb.value);
  const availableQuarters = computed(() => availableQuartersFromDb.value);

  const filters = computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    quarter: selectedQuarter.value,
    mode: filterMode.value,
  }));

  watch(activeMetric, (newMetric) => {
    if (dashboardData.value?.rankings) {
      rankings.value = dashboardData.value.rankings[newMetric] || [];
    }
  });

  const syncAvailableFilters = (response) => {
    if (response) {
      if (response.rankings) rankings.value = response.rankings[activeMetric.value] || [];
      
      // Rename product groups for UI consistency
      const rename = (name) => 
        (name === "Internet truyền hình" || name === "Internet Truyền hình") ? "Internet" : name;
      if (response.productGroups) {
        productGroups.value = response.productGroups;
      }
      
      if (response.availableYears) availableYearsFromDb.value = response.availableYears;
      if (response.availableMonths) availableMonthsFromDb.value = response.availableMonths;
      if (response.availableQuarters) availableQuartersFromDb.value = response.availableQuarters;

      if (dataType.value !== "all" && productGroups.value && !productGroups.value.includes(dataType.value)) {
        dataType.value = "all";
      }
    }
  };

  const openCompare = () => {
    suppressFetch.value = true;
    showCompareModal.value = true;
    nextTick(() => suppressFetch.value = false);
  };

  const getFetchParams = () => {
    let yearParam = selectedYear.value;
    if (isComparisonMode.value) {
      yearParam = [...availableYearsFromDb.value].map(y => parseInt(y)).sort((a, b) => a - b).join(",");
    }
    return {
      type: dataType.value,
      source: sourceType.value,
      year: yearParam,
      month: filterMode.value === "month" ? selectedMonth.value : "",
      quarter: filterMode.value === "quarter" ? selectedQuarter.value : "",
      mode: filterMode.value,
      viewMode: viewMode.value,
    };
  };

  const loadData = async () => {
    isProcessing.value = true;
    try {
      const response = await dashboardService.getDashboardData(getFetchParams());
      const data = response.data;

      // REQUIREMENT: Map "Internet truyền hình" (and variants) to shorter "Internet" for better UI
      const rename = (name) => 
        (name === "Internet truyền hình" || name === "Internet Truyền hình") ? "Internet" : name;

      if (data.categoryData) {
        Object.values(data.categoryData).forEach(m => {
          if (m.categories) m.categories = m.categories.map(rename);
          if (m.series) m.series.forEach(s => s.name = rename(s.name));
          if (m.pieData) m.pieData.forEach(p => p.name = rename(p.name));
        });
      }

      if (data.comparisonData) {
        Object.values(data.comparisonData).forEach(m => {
          if (m.categories) m.categories = m.categories.map(rename);
        });
      }

      if (data.rankings) {
        Object.values(data.rankings).forEach(list => {
          list.forEach(item => {
            if (item.category) item.category = rename(item.category);
          });
        });
      }

      if (data.targetAchievement && data.targetAchievement.labels) {
        data.targetAchievement.labels = data.targetAchievement.labels.map(rename);
      }

      dashboardData.value = data;
      syncAvailableFilters(data);
      return data;
    } catch (e) {
      toast.error(e.response?.data?.error || "Lỗi tải dữ liệu Dashboard");
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing, globalLoading, loadingStatusText, showCompareModal, suppressFetch, dashboardData, rankings, productGroups,
    activeMetric, dataType, sourceType, selectedYear, selectedMonth, selectedQuarter, filterMode, isComparisonMode, viewMode,
    availableYears, availableMonths, availableQuarters, filters,
    openCompare, loadData,
  };
}
