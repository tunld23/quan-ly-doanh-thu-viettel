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
    isComparisonMode: isComparisonMode.value,
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
      
      if (response.availableYears?.length > 0) {
        const years = new Set([...availableYearsFromDb.value, ...response.availableYears]);
        availableYearsFromDb.value = Array.from(years).sort((a, b) => b - a);
      }
      if (response.availableMonths?.length > 0) {
        const months = new Set([...availableMonthsFromDb.value, ...response.availableMonths]);
        availableMonthsFromDb.value = Array.from(months).sort((a, b) => parseInt(a) - parseInt(b));
      }
      if (response.availableQuarters?.length > 0) {
        const quarters = new Set([...availableQuartersFromDb.value, ...response.availableQuarters]);
        availableQuartersFromDb.value = Array.from(quarters).sort((a, b) => parseInt(a) - parseInt(b));
      }

      if (dataType.value !== "all" && productGroups.value && !productGroups.value.includes(dataType.value)) {
        dataType.value = "all";
      }
    }
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
    isProcessing, globalLoading, loadingStatusText, suppressFetch, dashboardData, rankings, productGroups,
    activeMetric, dataType, sourceType, selectedYear, selectedMonth, selectedQuarter, filterMode, isComparisonMode, viewMode,
    availableYears, availableMonths, availableQuarters, filters,
    loadData,
  };
}
