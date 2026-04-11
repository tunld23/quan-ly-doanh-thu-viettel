import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "./useToast";
import { targetService, dashboardService } from "../services/apiService";

export const PREDEFINED_TARGETS = [
  { id: "dealer_revenue", name: "Doanh thu Kênh Đại lý", dbName: "đại lý", type: "Doanh thu", unit: "VNĐ" },
  { id: "tendoo_revenue", name: "Doanh thu Tendoo", dbName: "DTDV Tendoo", type: "Doanh thu", unit: "VNĐ" },
  { id: "am_revenue", name: "Doanh thu Kênh AM", dbName: "kênh AM", type: "Doanh thu", unit: "VNĐ" },
  { id: "gia_han_sub", name: "TB Gia hạn", dbName: "gia hạn", type: "Thuê Bao", unit: "TB" },
  { id: "mysign_sub", name: "TB Mysign", dbName: "Mysign", type: "Thuê Bao", unit: "TB" },
  { id: "m2m_sub", name: "TB M2M/IOT", dbName: "M2M/IOT", type: "Thuê Bao", unit: "TB" },
  { id: "tendoo_sub", name: "TB Tendoo", dbName: "TB Tendoo", type: "Thuê Bao", unit: "TB" },
  { id: "internet_sub", name: "TB FTTH KHDN (Internet)", dbName: "Internet", type: "Thuê Bao", unit: "TB" },
  { id: "new_biz_sub", name: "TB DN mới", dbName: "mới thành lập", type: "Thuê Bao", unit: "TB" },
];

export function useTargets() {
  const toast = useToast();

  const years = ref([]);
  const allTargets = ref([]);
  const loading = ref(false);
  const submitting = ref(false);

  // List Filters
  const listYearFilter = ref(new Date().getFullYear());
  const listMonthFilter = ref((new Date().getMonth() + 1).toString().padStart(2, "0"));

  const form = ref({
    tr_year: new Date().getFullYear(),
    tr_month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    target_id: PREDEFINED_TARGETS[0].id,
    amount: 0,
  });

  const selectedTargetInfo = computed(() => {
    return PREDEFINED_TARGETS.find(t => t.id === form.value.target_id);
  });

  const fetchYears = async () => {
    try {
      const res = await dashboardService.getYears();
      const dbYears = (res.data || []).map(y => parseInt(y, 10));
      if (!dbYears.includes(new Date().getFullYear())) {
        dbYears.push(new Date().getFullYear());
      }
      years.value = dbYears.sort((a, b) => b - a);
      if (dbYears.length > 0) {
        if (!form.value.tr_year || !dbYears.includes(parseInt(form.value.tr_year))) {
          form.value.tr_year = dbYears[0];
        }
        listYearFilter.value = form.value.tr_year;
      }
    } catch (err) {
      console.error("Error fetching years:", err);
      years.value = [new Date().getFullYear()];
    }
  };

  const fetchTargets = async () => {
    loading.value = true;
    try {
      const res = await targetService.getTargets();
      allTargets.value = res.data;
    } catch (err) {
      console.error("Error fetching targets:", err);
    } finally {
      loading.value = false;
    }
  };

  const submitTarget = async () => {
    const info = selectedTargetInfo.value;
    if (!info) return;

    submitting.value = true;
    try {
      await targetService.createTarget({
        tr_year: form.value.tr_year,
        tr_month: form.value.tr_month,
        source_type: info.source,
        product_group: info.dbName,
        type: info.type,
        amount: form.value.amount,
      });
      toast.success("Lưu chỉ tiêu thành công");
      await fetchTargets();
    } catch (err) {
      toast.error(
        "Lỗi khi lưu chỉ tiêu: " + (err.response?.data?.error || err.message),
      );
    } finally {
      submitting.value = false;
    }
  };

  const deleteTarget = async (target) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chỉ tiêu này?")) return;
    try {
      await targetService.deleteTarget({
        tr_year: target.tr_year,
        tr_month: target.tr_month,
        source_type: target.source_type,
        product_group: target.product_group,
        type: target.type,
      });
      toast.success("Xóa chỉ tiêu thành công");
      await fetchTargets();
    } catch (err) {
      toast.error("Lỗi khi xóa chỉ tiêu");
    }
  };

  onMounted(() => {
    fetchYears();
    fetchTargets();
  });

  return {
    form,
    loading,
    submitting,
    years,
    allTargets,
    listYearFilter,
    listMonthFilter,
    selectedTargetInfo,
    PREDEFINED_TARGETS,
    fetchTargets,
    submitTarget,
    deleteTarget,
  };
}
