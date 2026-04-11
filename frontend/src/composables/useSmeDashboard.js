import { ref, computed } from "vue";
import { dashboardService, targetService } from "../services/apiService";
import { PREDEFINED_TARGETS } from "./useTargets";

export function useSmeDashboard() {
  const kpis = ref([
    { name: "đại lý", target: 0, actual: 0, unit: "triệu đồng" },
    { name: "DTDV Tendoo", target: 0, actual: 0, unit: "triệu đồng" },
    { name: "kênh AM", target: 0, actual: 0, unit: "triệu đồng" },
    { name: "gia hạn", target: 0, actual: 0, unit: "TB" },
    { name: "Mysign", target: 0, actual: 0, unit: "TB" },
    { name: "M2M/IOT", target: 0, actual: 0, unit: "TB" },
    { name: "TB Tendoo", target: 0, actual: 0, unit: "TB" },
    { name: "Internet", target: 0, actual: 0, unit: "TB" },
    { name: "mới thành lập", target: 0, actual: 0, unit: "TB" },
  ]);

  const loading = ref(false);
  const selectedDate = ref(new Date().toISOString().split("T")[0]);
  const comparisons = ref({
    today: 0,
    yesterday: 0,
    lastMonth: 0,
    lastYear: 0,
  });

  const fetchTargets = async (year, month) => {
    try {
      const res = await targetService.getTargets({ year, month });
      const targets = res.data;
      
      kpis.value.forEach((kpi, index) => {
        // Map KPI index to PREDEFINED_TARGETS
        const pt = PREDEFINED_TARGETS[index];
        if (!pt) return;

        const found = targets.find(t => 
          t.product_group === pt.dbName &&
          t.type === pt.type &&
          parseInt(t.tr_year) === parseInt(year) &&
          t.tr_month === String(month).padStart(2, "0")
        );

        if (found) {
          kpi.target = found.amount;
          if (kpi.unit === "triệu đồng") {
            kpi.target = found.amount / 1000000;
          }
        } else {
          kpi.target = 0;
        }
      });
    } catch (err) {
      console.error("Failed to fetch targets:", err);
    }
  };

  const fetchKpis = async () => {
    loading.value = true;
    kpis.value.forEach((k) => (k.actual = 0));
    try {
      const d = new Date(selectedDate.value);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();

      await fetchTargets(year, month);

      const summaryRes = await dashboardService.getSmeDashboardSummary({ 
        year, month, day, includeSip: true 
      });
      
      const { subscriberData, comparisonData, dealerData, amData, tendooData } = summaryRes.data;

      console.log("Performance Comparisons:", comparisonData);
      comparisons.value = comparisonData || { today: 0, yesterday: 0, lastMonth: 0, lastYear: 0, todayMtd: 0 };

      const getVal = (resData, field = "withoutVat") => {
        const pie = resData?.categoryData?.[field]?.pieData || [];
        return pie.reduce((sum, item) => sum + item.value, 0);
      };

      kpis.value[0].actual = parseFloat(
        (getVal(dealerData) / 1000000).toFixed(2),
      );
      kpis.value[1].actual = parseFloat(
        (getVal(tendooData) / 1000000).toFixed(2),
      );
      kpis.value[2].actual = parseFloat((getVal(amData) / 1000000).toFixed(2));

      const subPie =
        subscriberData?.categoryData?.serviceCount?.pieData || [];
      const updateSub = (name, index) => {
        const found = subPie.find((p) =>
          p.name.toLowerCase().includes(name.toLowerCase()),
        );
        kpis.value[index].actual = found ? found.value : 0;
      };

      updateSub("Gia hạn", 3);
      updateSub("Mysign", 4);
      updateSub("M2M", 5);
      updateSub("Tendoo", 6);
      updateSub("Internet", 7);
      updateSub("mới thành lập", 8);
    } catch (err) {
      console.error("Failed to fetch real KPIs:", err);
    } finally {
      loading.value = false;
    }
  };

  const findKpi = (query) => {
    return (
      kpis.value.find((k) =>
        k.name.toLowerCase().includes(query.toLowerCase()),
      ) || { target: 0, actual: 0, name: query, unit: "" }
    );
  };

  const revenueKpis = computed(() => [
    { title: "Kênh Đại lý", ...findKpi("đại lý"), icon: "office-building" },
    { title: "Tendoo", ...findKpi("DTDV Tendoo"), icon: "lightning-bolt" },
    { title: "Kênh AM", ...findKpi("kênh AM"), icon: "users" },
  ]);

  const subscriberKpis = computed(() => ({
    giaHan: findKpi("gia hạn"),
    details: [
      { title: "Mysign SME mới", ...findKpi("Mysign") },
      { title: "M2M/IOT", ...findKpi("M2M/IOT") },
    ],
    techFocus: [
      { title: "TB Tendoo", ...findKpi("TB Tendoo") },
      { title: "TB FTTH KHDN", ...findKpi("Internet") },
      { title: "TB DN mới (GPCNTT)", ...findKpi("mới thành lập") },
    ],
  }));

  const calcPercent = (actual, target) => {
    if (!target) return 0;
    return ((actual / target) * 100).toFixed(1);
  };

  return {
    kpis,
    loading,
    selectedDate,
    comparisons,
    fetchKpis,
    revenueKpis,
    subscriberKpis,
    calcPercent,
  };
}
