import { ref, computed } from "vue";
import { dashboardService } from "../services/apiService";

export function useSmeDashboard() {
  const kpis = ref([
    { name: "đại lý", target: 82500, actual: 0, unit: "triệu đồng" },
    { name: "DTDV Tendoo", target: 12500, actual: 0, unit: "triệu đồng" },
    { name: "kênh AM", target: 45000, actual: 0, unit: "triệu đồng" },
    { name: "gia hạn", target: 15400, actual: 0, unit: "TB" },
    { name: "Mysign", target: 5000, actual: 0, unit: "TB" },
    { name: "M2M/IOT", target: 3000, actual: 0, unit: "TB" },
    { name: "TB Tendoo", target: 8000, actual: 0, unit: "TB" },
    { name: "FTTH", target: 1200, actual: 0, unit: "TB" },
    { name: "mới thành lập", target: 4500, actual: 0, unit: "TB" },
  ]);

  const loading = ref(false);
  const selectedDate = ref(new Date().toISOString().split("T")[0]);
  const comparisons = ref({ today: 0, yesterday: 0, lastMonth: 0, lastYear: 0 });

  const fetchTargets = async (year, month) => {
    try {
      const res = await dashboardService.getDashboardData({ viewMode: "target", year, month, mode: "month" });
      if (res.data.targetAchievement) {
        const achievement = res.data.targetAchievement;
        const labels = achievement.labels;
        const yearData = achievement.yearsData[year];
        if (!yearData) return;

        labels.forEach((label, idx) => {
          const kpi = kpis.value.find((k) => k.name.toLowerCase() === label.toLowerCase());
          if (kpi) {
            if (kpi.unit === "triệu đồng" && yearData.revenueDetails) {
              kpi.target = yearData.revenueDetails[idx].target;
            } else if (kpi.unit === "TB" && yearData.subDetails) {
              kpi.target = yearData.subDetails[idx].target;
            }
          }
        });
      }
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

      const [revenueRes, subscriberRes, compRes, dealerRes, amRes, tendooRes] = await Promise.all([
        dashboardService.getDashboardData({ source: "all", type: "all", viewMode: "actual", year, month, day, includeSip: true }),
        dashboardService.getDashboardData({ source: "all", type: "all", viewMode: "subscriber", year, month, day, includeSip: true }),
        dashboardService.getPerformanceComparison({ year, month, day, includeSip: true }),
        dashboardService.getDashboardData({ source: "dealer", type: "all", viewMode: "actual", year, month, day, includeSip: true }),
        dashboardService.getDashboardData({ source: "am", type: "all", viewMode: "actual", year, month, day, includeSip: true }),
        dashboardService.getDashboardData({ type: "Tendoo", viewMode: "actual", year, month, day, includeSip: true }),
      ]);

      comparisons.value = compRes.data;

      const getVal = (res, field = "withoutVat") => {
        const pie = res.data.categoryData?.[field]?.pieData || [];
        return pie.reduce((sum, item) => sum + item.value, 0);
      };

      kpis.value[0].actual = parseFloat((getVal(dealerRes) / 1000000).toFixed(2));
      kpis.value[1].actual = parseFloat((getVal(tendooRes) / 1000000).toFixed(2));
      kpis.value[2].actual = parseFloat((getVal(amRes) / 1000000).toFixed(2));

      const subPie = subscriberRes.data.categoryData?.serviceCount?.pieData || [];
      const updateSub = (name, index) => {
        const found = subPie.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
        kpis.value[index].actual = found ? found.value : 0;
      };

      updateSub("Gia hạn", 3);
      updateSub("Mysign", 4);
      updateSub("M2M", 5);
      updateSub("Tendoo", 6);
      updateSub("FTTH", 7);
      updateSub("mới thành lập", 8);
    } catch (err) {
      console.error("Failed to fetch real KPIs:", err);
    } finally {
      loading.value = false;
    }
  };

  const findKpi = (query) => {
    return kpis.value.find((k) => k.name.toLowerCase().includes(query.toLowerCase())) || { target: 0, actual: 0, name: query, unit: "" };
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
        { title: "TB FTTH KHDN", ...findKpi("FTTH") },
        { title: "TB DN mới (GPCNTT)", ...findKpi("mới thành lập") },
    ]
  }));

  const calcPercent = (actual, target) => {
    if (!target) return 0;
    return ((actual / target) * 100).toFixed(1);
  };

  return {
    kpis, loading, selectedDate, comparisons,
    fetchKpis, revenueKpis, subscriberKpis, calcPercent
  };
}
