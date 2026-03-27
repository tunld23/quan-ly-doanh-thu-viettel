import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "./useToast";
import { targetService, dashboardService } from "../services/apiService";

export function useTargets() {
  const toast = useToast();

  const years = ref([]);
  const productGroups = ref([]);
  const allTargets = ref([]);
  const loading = ref(false);
  const submitting = ref(false);

  // List Filters
  const listTypeFilter = ref("Doanh thu");
  const listYearFilter = ref("all");
  const listGroupFilter = ref("all");

  const productGroupsCache = {
    am: null,
    dealer: null,
  };

  const form = ref({
    tr_year: new Date().getFullYear(),
    tr_month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    source_type: "dealer",
    product_group: "",
    type: "Doanh thu",
    amount: 0,
  });

  const uniqueGroupsInList = computed(() => {
    const groups = new Set(allTargets.value.map((t) => t.product_group));
    return [...groups].sort();
  });

  const filteredTargets = computed(() => {
    let list = allTargets.value;
    list = list.filter((t) => t.type === listTypeFilter.value);
    if (listYearFilter.value !== "all") {
      list = list.filter(
        (t) => t.tr_year.toString() === listYearFilter.value.toString(),
      );
    }
    if (listGroupFilter.value !== "all") {
      list = list.filter((t) => t.product_group === listGroupFilter.value);
    }
    return list.sort((a, b) => {
      if (a.tr_year !== b.tr_year) return b.tr_year - a.tr_year;
      return b.tr_month.localeCompare(a.tr_month);
    });
  });

  const fetchYears = async () => {
    try {
      const res = await dashboardService.getYears();
      const dbYears = (res.data || []).map(y => parseInt(y, 10));
      years.value = dbYears;
      if (dbYears.length > 0) {
        if (!form.value.tr_year || !dbYears.includes(form.value.tr_year)) {
          form.value.tr_year = dbYears[0];
        }
      }
    } catch (err) {
      console.error("Error fetching years:", err);
    }
  };

  const fetchProductGroups = async () => {
    if (productGroupsCache[form.value.source_type]) {
      productGroups.value = productGroupsCache[form.value.source_type];
      updateProductGroupSelection();
      return;
    }
    try {
      const res = await dashboardService.getProductGroups(
        form.value.source_type,
      );
      // Chuẩn hóa tên nhóm sản phẩm để tránh trùng lặp
      let groupsFromDb = res.data.map(g => {
        if (g === 'BHXH') return 'vBHXH';
        if (g.toLowerCase() === 'internet truyền hình') return 'Internet Truyền hình';
        return g;
      });
      const systemDefaults = {
        am: [
          "CA",
          "EasyBooks",
          "HDDT",
          "Internet Truyền hình",
          "MySign",
          "Tendoo",
          "vBHXH",
          "vContract",
          "vTracking",
        ],
        dealer: ["CA", "HDDT", "vBHXH"],
      };
      const combined = [
        ...new Set([
          ...groupsFromDb,
          ...(systemDefaults[form.value.source_type] || []),
        ]),
      ]
        .filter(Boolean)
        .sort();
      productGroupsCache[form.value.source_type] = combined;
      productGroups.value = combined;
      updateProductGroupSelection();
    } catch (err) {
      console.error("Error fetching product groups:", err);
    }
  };

  const updateProductGroupSelection = () => {
    if (
      productGroups.value.length > 0 &&
      !productGroups.value.includes(form.value.product_group)
    ) {
      form.value.product_group = productGroups.value[0];
    }
  };

  const fetchTargets = async () => {
    loading.value = true;
    try {
      const res = await targetService.getTargets();
      allTargets.value = res.data.map(t => {
        if (t.product_group === 'BHXH') t.product_group = 'vBHXH';
        if (t.product_group && t.product_group.toLowerCase() === 'internet truyền hình') t.product_group = 'Internet Truyền hình';
        return t;
      });
    } catch (err) {
      console.error("Error fetching targets:", err);
    } finally {
      loading.value = false;
    }
  };

  const submitTarget = async () => {
    if (!form.value.product_group) {
      toast.error("Vui lòng chọn nhóm sản phẩm");
      return;
    }
    submitting.value = true;
    try {
      await targetService.createTarget(form.value);
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

  watch(
    () => form.value.source_type,
    () => fetchProductGroups(),
  );
  watch(
    () => form.value.type,
    () => {
      form.value.amount = 0;
    },
  );

  onMounted(() => {
    fetchYears();
    fetchProductGroups();
    fetchTargets();
  });

  return {
    form,
    loading,
    submitting,
    years,
    productGroups,
    allTargets,
    listTypeFilter,
    listYearFilter,
    listGroupFilter,
    uniqueGroupsInList,
    filteredTargets,
    fetchTargets,
    submitTarget,
    deleteTarget,
  };
}
