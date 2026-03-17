<script setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useToast } from "../composables/useToast";

const toast = useToast();
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

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

// Computed list of unique product groups present in the data for filtering
const uniqueGroupsInList = computed(() => {
  const groups = new Set(allTargets.value.map((t) => t.product_group));
  return [...groups].sort();
});

// Local Filter logic: TYPE + YEAR + GROUP
const filteredTargets = computed(() => {
  let list = allTargets.value;

  // 1. Filter by Type
  list = list.filter((t) => t.type === listTypeFilter.value);

  // 2. Filter by Year
  if (listYearFilter.value !== "all") {
    list = list.filter(
      (t) => t.tr_year.toString() === listYearFilter.value.toString(),
    );
  }

  // 3. Filter by Product Group
  if (listGroupFilter.value !== "all") {
    list = list.filter((t) => t.product_group === listGroupFilter.value);
  }

  // Sort Descending
  return list.sort((a, b) => {
    if (a.tr_year !== b.tr_year) return b.tr_year - a.tr_year;
    return b.tr_month.localeCompare(a.tr_month);
  });
});

const fetchYears = async () => {
  try {
    const res = await axios.get(`${API_BASE}/product/years`);
    years.value = res.data;
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
    const res = await axios.get(
      `${API_BASE}/product-groups?source=${form.value.source_type}`,
    );
    let groupsFromDb = res.data;
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
    const res = await axios.get(`${API_BASE}/targets`);
    allTargets.value = res.data;
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
    await axios.post(`${API_BASE}/targets`, form.value);
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
    await axios.delete(`${API_BASE}/targets`, {
      params: {
        tr_year: target.tr_year,
        tr_month: target.tr_month,
        source_type: target.source_type,
        product_group: target.product_group,
        type: target.type,
      },
    });
    toast.success("Xóa chỉ tiêu thành công");
    await fetchTargets();
  } catch (err) {
    toast.error("Lỗi khi xóa chỉ tiêu");
  }
};

watch(
  () => form.value.source_type,
  () => {
    fetchProductGroups();
  },
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
</script>

<template>
  <div class="target-config-container p-6">
    <div class="max-w-3xl mx-auto">
      <h1
        class="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 uppercase tracking-tight"
      >
        Quản lý Chỉ tiêu
      </h1>

      <!-- INPUT FORM -->
      <div
        class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 backdrop-blur-sm bg-white/90"
      >
        <!-- ROW 1: Source Selection -->
        <div class="mb-6">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3"
          >
            <svg
              class="w-4 h-4 mr-2 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            1. Kênh nạp dữ liệu
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="form.source_type = 'dealer'"
              :class="`py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5 ${form.source_type === 'dealer' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-indigo-100'}`"
            >
              <span class="text-xs uppercase tracking-widest">Đại Lý</span>
              <span class="text-[10px] font-normal opacity-70 italic"
                >Ủy Quyền</span
              >
            </button>
            <button
              @click="form.source_type = 'am'"
              :class="`py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5 ${form.source_type === 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-indigo-100'}`"
            >
              <span class="text-xs uppercase tracking-widest">AM</span>
              <span class="text-[10px] font-normal opacity-70 italic"
                >Account Manager</span
              >
            </button>
          </div>
        </div>

        <!-- ROW 2: Date Selection -->
        <div class="mb-6 pt-5 border-t border-gray-50">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3"
          >
            <svg
              class="w-4 h-4 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            2. Thời gian
          </label>
          <div class="grid grid-cols-2 gap-3">
            <select v-model="form.tr_month" class="input-modern-sm">
              <option
                v-for="m in 12"
                :key="m"
                :value="m.toString().padStart(2, '0')"
              >
                Tháng {{ m }}
              </option>
            </select>
            <select v-model="form.tr_year" class="input-modern-sm">
              <option v-for="y in years" :key="y" :value="y">
                Năm {{ y }}
              </option>
            </select>
          </div>
        </div>

        <!-- ROW 3: Product Group -->
        <div class="mb-6 pt-5 border-t border-gray-50">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3"
          >
            <svg
              class="w-4 h-4 mr-2 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            3. Nhóm sản phẩm
          </label>
          <div class="relative">
            <select v-model="form.product_group" class="input-modern-sm">
              <option value="" disabled>-- Chọn nhóm --</option>
              <option v-for="pg in productGroups" :key="pg" :value="pg">
                {{ pg }}
              </option>
            </select>
          </div>
        </div>

        <!-- ROW 4: Type/Amount -->
        <div class="mb-6 pt-5 border-t border-gray-50">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3"
          >
            <svg
              class="w-4 h-4 mr-2 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            4. Loại và Giá trị chỉ tiêu
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select v-model="form.type" class="input-modern-sm font-bold">
              <option value="Thuê Bao">Chỉ tiêu Thuê Bao</option>
              <option value="Doanh thu">Chỉ tiêu Doanh thu</option>
            </select>
            <div class="relative">
              <input
                type="number"
                v-model="form.amount"
                class="input-field-sm"
                placeholder="0"
              />
              <div
                class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase"
              >
                {{ form.type === "Doanh thu" ? "đ" : "tb" }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-5 border-t border-gray-50">
          <button
            @click="submitTarget"
            :disabled="submitting || !form.product_group"
            class="px-8 py-3 bg-blue-600 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all flex items-center space-x-2 uppercase tracking-widest text-xs"
          >
            <span v-if="submitting">Lưu...</span>
            <span v-else>Lưu mục tiêu</span>
          </button>
        </div>
      </div>

      <div
        class="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
          <!-- Row 1: Title -->
          <div class="mb-4">
            <h2
              class="text-xs font-black text-gray-700 uppercase tracking-widest"
            >
              Danh sách ghi nhận
            </h2>
          </div>

          <!-- Row 2: Controls (Splitted Left/Right) -->
          <div class="flex items-center justify-between">
            <!-- Left side: Toggle -->
            <div
              class="flex items-center space-x-1 p-0.5 bg-gray-200/50 rounded-lg"
            >
              <button
                @click="listTypeFilter = 'Doanh thu'"
                :class="
                  listTypeFilter === 'Doanh thu'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500'
                "
                class="px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all"
              >
                Doanh thu
              </button>
              <button
                @click="listTypeFilter = 'Thuê Bao'"
                :class="
                  listTypeFilter === 'Thuê Bao'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500'
                "
                class="px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all"
              >
                Thuê bao
              </button>
            </div>

            <!-- Right side: Dropboxes -->
            <div class="flex items-center space-x-2">
              <select v-model="listYearFilter" class="compact-filter-select">
                <option value="all">Tất cả Năm</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
              <select
                v-model="listGroupFilter"
                class="compact-filter-select max-w-[130px]"
              >
                <option value="all">Tất cả Nhóm</option>
                <option v-for="gp in uniqueGroupsInList" :key="gp" :value="gp">
                  {{ gp }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr
                class="bg-gray-50/60 text-gray-400 text-[9px] font-black uppercase tracking-[0.12em]"
              >
                <th class="px-6 py-4 border-b border-gray-50">Kênh</th>
                <th class="px-6 py-4 border-b border-gray-50">Kỳ hạn</th>
                <th class="px-6 py-4 border-b border-gray-50">Nhóm hàng</th>
                <th class="px-6 py-4 border-b border-gray-50 text-right">
                  Mục tiêu
                </th>
                <th class="px-6 py-4 border-b border-gray-50 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="loading">
                <td
                  colspan="5"
                  class="px-6 py-10 text-center text-gray-400 text-xs font-bold animate-pulse"
                >
                  Đang nạp dữ liệu...
                </td>
              </tr>
              <tr v-else-if="filteredTargets.length === 0">
                <td colspan="5" class="px-6 py-16 text-center">
                  <div class="text-gray-300 italic text-sm mb-1">
                    Không có dữ liệu phù hợp
                  </div>
                  <div
                    class="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60"
                  >
                    Hãy thay đổi bộ lọc
                  </div>
                </td>
              </tr>
              <tr
                v-for="t in filteredTargets"
                :key="`${t.tr_year}-${t.tr_month}-${t.source_type}-${t.product_group}-${t.type}`"
                class="group hover:bg-blue-50/30 transition-all border-l-4 border-transparent hover:border-blue-500"
              >
                <td class="px-6 py-4">
                  <span
                    :class="
                      t.source_type === 'am'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-emerald-50 text-emerald-600'
                    "
                    class="px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm border border-black/5"
                  >
                    {{ t.source_type }}
                  </span>
                </td>
                <td
                  class="px-6 py-4 text-xs font-bold text-gray-500 tabular-nums"
                >
                  {{ t.tr_month }}/{{ t.tr_year }}
                </td>
                <td class="px-6 py-4 text-xs font-black text-gray-700">
                  {{ t.product_group }}
                </td>
                <td
                  class="px-6 py-4 text-right text-sm font-black text-gray-900 tabular-nums"
                >
                  {{ t.amount.toLocaleString("vi-VN") }}
                  <span
                    class="text-[9px] text-gray-400 font-normal ml-0.5 uppercase tracking-tighter"
                    >{{ t.type === "Doanh thu" ? "đ" : "tb" }}</span
                  >
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="deleteTarget(t)"
                    class="p-1.5 text-gray-300 hover:text-red-500 transition-all rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modern-sm {
  @apply w-full px-4 py-2.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white focus:border-blue-500 transition-all outline-none appearance-none font-bold text-gray-700 text-sm cursor-pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}

.input-field-sm {
  @apply w-full pl-4 pr-9 py-2.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white focus:border-blue-500 transition-all outline-none font-black text-gray-800 text-sm;
}

.compact-filter-select {
  @apply px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[10px] font-black text-gray-600 outline-none focus:border-blue-400 appearance-none cursor-pointer pr-7;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/xml' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1em 1em;
}
</style>
