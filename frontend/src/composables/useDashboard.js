import { ref, computed, nextTick, watch } from "vue";
import { fetchDashboardData } from "../services/dashboardService";
import { useToast } from "./useToast";

/**
 * Composable to manage Dashboard state and logic
 */
export function useDashboard() {
  // --- UI STATE ---
  const isProcessing = ref(false);
  const globalLoading = ref(false);
  const loadingStatusText = ref("Đang kết nối Server...");
  const showCompareModal = ref(false);
  const suppressFetch = ref(false);
  const toast = useToast();

  // --- DATA STATE ---
  const dashboardData = ref(null);
  const rankings = ref([]);
  const productGroups = ref(["all"]);
  const availableYearsFromDb = ref([]);
  const availableMonthsFromDb = ref([]);
  const availableQuartersFromDb = ref([]);

  // --- FILTER STATE ---
  const activeMetric = ref("withoutVat");
  const dataType = ref("all");
  const sourceType = ref("all");
  const selectedYear = ref("");
  const selectedMonth = ref("");
  const selectedQuarter = ref("");
  const filterMode = ref("all");
  const isComparisonMode = ref(false);

  // --- COMPUTED ---
  const availableYears = computed(() => availableYearsFromDb.value);
  const availableMonths = computed(() => availableMonthsFromDb.value);
  const availableQuarters = computed(() => availableQuartersFromDb.value);

  const filters = computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    quarter: selectedQuarter.value,
    mode: filterMode.value,
  }));

  // --- WATCHERS ---
  
  // Update rankings when metric changes (from cached data)
  watch(activeMetric, (newMetric) => {
    if (dashboardData.value?.rankings) {
      rankings.value = dashboardData.value.rankings[newMetric] || [];
    }
  });

  // Reset selections if they become invalid after data refresh
  watch(availableYearsFromDb, (newYears) => {
    if (selectedYear.value && !newYears.includes(String(selectedYear.value))) {
      selectedYear.value = "";
    }
  });

  watch(availableMonthsFromDb, (newMonths) => {
    if (selectedMonth.value && !newMonths.includes(String(selectedMonth.value))) {
      selectedMonth.value = "";
    }
  });

  watch(availableQuartersFromDb, (newQuarters) => {
    if (selectedQuarter.value && !newQuarters.includes(String(selectedQuarter.value))) {
      selectedQuarter.value = "";
    }
  });

  // --- METHODS ---

  /**
   * Enter comparison mode and open modal
   */
  const openCompare = () => {
    suppressFetch.value = true;
    selectedYear.value = "2025";
    filterMode.value = "all";
    selectedMonth.value = "";
    selectedQuarter.value = "";
    showCompareModal.value = true;
    nextTick(() => suppressFetch.value = false);
  };

  /**
   * Build query parameters for API call
   */
  const getFetchParams = () => {
    let yearParam = selectedYear.value;

    if (isComparisonMode.value) {
      const sortedYears = [...availableYearsFromDb.value]
        .map(y => parseInt(y))
        .sort((a, b) => b - a);
      
      const pivotYear = parseInt(selectedYear.value) || sortedYears[0];
      const pivotIndex = sortedYears.indexOf(pivotYear);
      
      // Get up to 3 years starting from the pivot
      const yearsToFetch = pivotIndex !== -1 
        ? sortedYears.slice(pivotIndex, pivotIndex + 3)
        : sortedYears.slice(0, 3);
        
      yearParam = yearsToFetch.join(",");
    }

    return {
      type: dataType.value,
      source: sourceType.value,
      year: yearParam,
      month: filterMode.value === "month" ? selectedMonth.value : "",
      quarter: filterMode.value === "quarter" ? selectedQuarter.value : "",
      mode: filterMode.value,
    };
  };

  /**
   * Main data loading function
   */
  const loadData = async () => {
    // Safety check for comparison mode
    if (isComparisonMode.value && !selectedYear.value) {
      isComparisonMode.value = false;
    }

    isProcessing.value = true;
    try {
      const params = getFetchParams();
      const response = await fetchDashboardData(params);
      
      dashboardData.value = response;

      // Sync data to state
      if (response) {
        if (response.rankings) rankings.value = response.rankings[activeMetric.value] || [];
        if (response.productGroups) productGroups.value = response.productGroups;
        if (response.availableYears) availableYearsFromDb.value = response.availableYears;
        if (response.availableMonths) availableMonthsFromDb.value = response.availableMonths;
        if (response.availableQuarters) availableQuartersFromDb.value = response.availableQuarters;

        // Auto-reset category if it no longer exists in current source
        if (dataType.value !== "all" && response.productGroups && !response.productGroups.includes(dataType.value)) {
          dataType.value = "all";
        }
      }
      
      return response;
    } catch (e) {
      console.error("Dashboard Load Error:", e);
      toast.error(e.message || "Lỗi tải dữ liệu Dashboard");
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    // State
    isProcessing,
    globalLoading,
    loadingStatusText,
    showCompareModal,
    suppressFetch,
    dashboardData,
    rankings,
    productGroups,
    activeMetric,
    dataType,
    sourceType,
    selectedYear,
    selectedMonth,
    selectedQuarter,
    filterMode,
    isComparisonMode,
    
    // Computed
    availableYears,
    availableMonths,
    availableQuarters,
    filters,
    
    // Actions
    openCompare,
    loadData,
  };
}
