<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useToast } from "../composables/useToast";
import FileUpload from "../components/common/FileUpload.vue";
import { importService, dashboardService, settingService } from "../services/apiService";

const toast = useToast();

const m2mKeywords = ref(["m2m", "evnblu", "dbiz10_1", "sd70ts"]);
const showM2mDialog = ref(false);
const newKeyword = ref("");

const fetchSettings = async () => {
  try {
    const res = await settingService.getSetting('m2m_keywords');
    if (res.data && res.data.value) {
      m2mKeywords.value = res.data.value;
    }
  } catch(e) {
    // silently fail
  }
};

const saveM2mKeywords = async () => {
  try {
    await settingService.updateSetting('m2m_keywords', m2mKeywords.value);
    toast.success("Đã cập nhật danh sách cấu hình M2M");
    showM2mDialog.value = false;
  } catch(e) {
    toast.error("Lỗi khi cập nhật cấu hình");
  }
};

const addKeyword = () => {
  const kw = newKeyword.value.trim().toLowerCase();
  if (kw && !m2mKeywords.value.includes(kw)) {
    m2mKeywords.value.push(kw);
    newKeyword.value = "";
  }
};

const removeKeyword = (idx) => {
  m2mKeywords.value.splice(idx, 1);
};

const productGroupsMap = {
  dealer: ["CA", "HDDT", "vBHXH"],
  am: [
    "CA",
    "EasyBooks",
    "HDDT",
    "Internet",
    "M2M/IOT",
    "MySign",
    "Tendoo",
    "vBHXH",
    "vContract",
    "vTracking",
  ],
};

const selectedType = ref("");
const selectedSource = ref("dealer");
const file = ref(null);
const importing = ref(false);
const manualMonth = ref(String(new Date().getMonth() + 1).padStart(2, "0"));
const manualYear = ref(String(new Date().getFullYear()));
const availableYears = ref([]);

const fetchYears = async () => {
  try {
    const response = await dashboardService.getYears();
    availableYears.value = response.data;
    if (
      availableYears.value.length > 0 &&
      !availableYears.value.includes(manualYear.value)
    ) {
      manualYear.value = availableYears.value[0];
    }
  } catch (err) {
    availableYears.value = [String(new Date().getFullYear())];
  }
};

onMounted(() => {
  fetchYears();
  fetchSettings();
});

const requiresManualDate = computed(() => {
  if (["Tendoo", "vContract", "vTracking"].includes(selectedType.value))
    return false;
  return false; // For now, let's keep it simple. If other types have date in Excel, they don't need manual input either.
});
const productGroups = computed(
  () => productGroupsMap[selectedSource.value] || [],
);

watch(selectedSource, (newSource) => {
  if (!productGroupsMap[newSource].includes(selectedType.value)) {
    selectedType.value = "";
  }
});

const handleImport = async () => {
  if (!file.value || !selectedType.value) return;
  importing.value = true;
  const formData = new FormData();
  formData.append("file", file.value);
  formData.append("type", selectedType.value);
  formData.append("source", selectedSource.value);
  if (requiresManualDate.value) {
    formData.append("months", manualMonth.value);
    formData.append("year", manualYear.value);
  }
  try {
    const response = await importService.importSales(formData);
    toast.success(response.data.message);
    file.value = null;
  } catch (err) {
    toast.error(err.response?.data?.error || "Có lỗi xảy ra khi import detail");
  } finally {
    importing.value = false;
  }
};

const rules = {
  CA: [
    { label: "Kỳ hạn", rule: "Cột Q (Ngày đấu nối)" },
    { label: "Nhân viên", rule: "Cột Z (Nhân viên đấu nối)" },
    { label: "Sản phẩm", rule: "Cột W (Mã-Mặt hàng)" },
  ],
  HDDT: [
    { label: "Kỳ hạn", rule: "Cột AE (Ngày hòa mạng)" },
    { label: "Nhân viên", rule: "Cột AA (Nhân viên đấu nối)" },
    { label: "Sản phẩm", rule: "Cột Q (Mã) & R (Tên hàng)" },
  ],
  vBHXH: [
    { label: "Kỳ hạn", rule: "Cột AA (Ngày hòa mạng)" },
    { label: "Nhân viên", rule: "Cột W (Nhân viên đấu nối)" },
    { label: "Sản phẩm", rule: "Cột P (Loại TB-Gói cước)" },
  ],
  MySign: [
    { label: "Kỳ hạn", rule: "Cột X (Ngày tạo TB)" },
    { label: "Nhân viên", rule: "Cột AA (Nhân viên đấu nối)" },
    { label: "Sản phẩm", rule: "Cột R (Mã) & T (Gói cước)" },
  ],
  EasyBooks: [
    { label: "Kỳ hạn", rule: "Cột P (Ngày đấu nối)" },
    { label: "Nhân viên", rule: "Cột O (Nhân viên đấu nối)" },
    { label: "Sản phẩm", rule: "Cột K (Gói cước)" },
  ],
  "Internet": [
    { label: "Kỳ hạn", rule: "Cột AF (Ngày nghiệm thu)" },
    { label: "Nhân viên", rule: "Cột AT (phải chứa 'SME')" },
    { label: "Sản phẩm", rule: "Cột Y (Mã-Mặt hàng)" },
    { label: "Loại trừ", rule: "Cột AZ (không chứa 'cá nhân')" },
  ],
  vContract: [
    { label: "Kỳ hạn", rule: "Cột V" },
    { label: "Nhân viên", rule: "Cột H" },
    { label: "Sản phẩm", rule: "Cột P (Gói cước)" },
  ],
  vTracking: [
    { label: "Kỳ hạn", rule: "Cột U" },
    { label: "Nhân viên", rule: "Cột Z" },
    { label: "Sản phẩm", rule: "Cột R (Mã) & S (Mặt hàng)" },
  ],
  Tendoo: [
    { label: "Kỳ hạn", rule: "Cột B (ngay_dang_ky_goi)" },
    { label: "Nhân viên", rule: "Cột H (ma_nhan_vien_tu_van)" },
    { label: "Sản phẩm", rule: "Cột J (goi_dang_ky)" },
    { label: "Thành tiền", rule: "Cột L (tự động thêm vào giá của sản phẩm)" },
  ],
};

const m2mRules = computed(() => {
  return [
    { label: "Kỳ hạn", rule: "Cột J (Ngày hòa mạng)" },
    { label: "Nhân viên", rule: "Cột Z (phải chứa 'sme')" },
    { label: "Sản phẩm", rule: `Cột M chứa 1 trong: ${m2mKeywords.value.join(', ')}` },
    { label: "Loại trừ", rule: "Cột N (không chứa 'cá nhân', 'tư nhân')" },
  ];
});

const defaultRule = [
  { label: "Điều kiện", rule: "Cột AR phải chứa tên nhóm Sp" },
  { label: "Kỳ hạn", rule: "Tự động lấy tháng/năm hiện tại" },
  { label: "Sản phẩm", rule: "Cột B (Mã) & C (Mặt hàng)" },
];
</script>

<template>
  <div class="sales-import-container p-6">
    <div class="max-w-4xl mx-auto">
      <h1
        class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 uppercase tracking-tight"
      >
        Quản lý Detail (Import Sales)
      </h1>

      <div
        class="bg-white rounded-xl shadow-lg p-8 border border-gray-100 backdrop-blur-sm bg-white/90"
      >
        <!-- 1. Source Selection -->
        <div class="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-4 ml-1"
          >
            <svg
              class="w-5 h-5 mr-2 text-indigo-500"
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
            1. Chọn Kênh nạp dữ liệu
          </label>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="selectedSource = 'dealer'"
              :class="
                selectedSource === 'dealer' ? 'active-btn' : 'inactive-btn'
              "
            >
              <span class="text-xs uppercase tracking-widest">Đại Lý</span>
              <span class="text-[10px] font-normal opacity-70 italic"
                >Ủy Quyền</span
              >
            </button>
            <button
              @click="selectedSource = 'am'"
              :class="selectedSource === 'am' ? 'active-btn' : 'inactive-btn'"
            >
              <span class="text-xs uppercase tracking-widest">AM</span>
              <span class="text-[10px] font-normal opacity-70 italic"
                >Account Manager</span
              >
            </button>
          </div>
        </div>

        <!-- 2. Type Selection -->
        <div class="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
          <label
            class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-4 ml-1"
          >
            <svg
              class="w-5 h-5 mr-2 text-indigo-500"
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
            2. Chọn Nhóm Sản phẩm
          </label>
          <select v-model="selectedType" class="input-modern">
            <option value="" disabled>-- Chọn nhóm sản phẩm --</option>
            <option v-for="group in productGroups" :key="group" :value="group">
              {{
                group === "Internet" ||
                group === "Internet"
                  ? "Internet"
                  : group
              }}
            </option>
          </select>
          <div class="mt-3" v-if="selectedType === 'M2M/IOT'">
             <button @click="showM2mDialog = true" class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-indigo-200 transition-colors">
               <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               Cấu hình Gói M2M/IOT hợp lệ
             </button>
          </div>

          <!-- Rules Display -->
          <div
            v-if="selectedType"
            class="mt-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100"
          >
            <div
              class="flex items-start space-x-3 text-xs text-blue-800 leading-relaxed"
            >
              <svg
                class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="font-black uppercase tracking-widest mb-2 italic">
                  Quy ước nạp:
                  <span class="text-blue-900 not-italic ml-1">{{
                    selectedType
                  }}</span>
                </p>
                <ul class="space-y-1.5 ml-1">
                  <li
                    v-for="rule in (selectedType === 'M2M/IOT' ? m2mRules : (rules[selectedType] || defaultRule))"
                    :key="rule.label"
                    class="flex items-center gap-1.5"
                  >
                    <div class="w-1 h-1 bg-blue-400 rounded-full"></div>
                    <b>{{ rule.label }}:</b> {{ rule.rule }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Manual Date Selection (Optional) -->
        <div
          v-if="requiresManualDate"
          class="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-6 animate-in slide-in-from-top-2 duration-300"
        >
          <div
            class="flex-shrink-0 bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="flex-1 grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label
                class="block text-[11px] font-black text-indigo-900/60 uppercase tracking-[0.1em] ml-1"
                >Tháng</label
              >
              <select v-model="manualMonth" class="date-select">
                <option
                  v-for="m in 12"
                  :key="m"
                  :value="String(m).padStart(2, '0')"
                >
                  Tháng {{ m }}
                </option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label
                class="block text-[11px] font-black text-indigo-900/60 uppercase tracking-[0.1em] ml-1"
                >Năm</label
              >
              <select v-model="manualYear" class="date-select">
                <option v-for="y in availableYears" :key="y" :value="y">
                  Năm {{ y }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <FileUpload v-model="file" label="3. Tải lên file dữ liệu" />

        <div class="flex justify-end pt-5 border-t border-gray-50">
          <button
            @click="handleImport"
            :disabled="!file || importing || !selectedType"
            class="px-10 py-4 bg-blue-600 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all flex items-center space-x-3 uppercase tracking-[0.2em] text-xs"
          >
            <span v-if="importing">Đang xử lý...</span>
            <span v-else>Import Detail</span>
          </button>
        </div>
      </div>
    </div>

    <!-- M2M Keywords Dialog -->
    <div v-if="showM2mDialog" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
          <h3 class="font-bold text-indigo-900 uppercase tracking-widest text-sm flex items-center">
            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Tùy chỉnh Gói M2M
          </h3>
          <button @click="showM2mDialog = false" class="text-gray-400 hover:text-gray-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-5">
          <p class="text-xs text-gray-500 mb-4 leading-relaxed">
            Thêm các <b>từ khóa</b> nằm trong Cột M để phần mềm tự động nhận diện đó là thuê bao M2M / IOT. (Không phân biệt hoa/thường).
          </p>
          
          <div class="flex flex-wrap gap-2 mb-5 max-h-48 overflow-y-auto p-2 border border-blue-50 bg-blue-50/20 rounded-xl">
             <div v-for="(kw, idx) in m2mKeywords" :key="kw" class="bg-white border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center shadow-sm">
                <b>{{ kw }}</b>
                <button @click="removeKeyword(idx)" class="ml-2 text-indigo-400 hover:text-red-500">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             <div v-if="m2mKeywords.length === 0" class="text-xs text-gray-400 italic p-2">Chưa có từ khóa nào.</div>
          </div>

          <div class="flex gap-2">
            <input @keyup.enter="addKeyword" v-model="newKeyword" type="text" placeholder="Nhập tên gói (VD: safeon1)" class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all">
            <button @click="addKeyword" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
              Thêm
            </button>
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showM2mDialog = false" class="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
            Hủy
          </button>
          <button @click="saveM2mKeywords" class="px-5 py-2 text-sm font-bold bg-black text-white rounded-xl shadow-md cursor-pointer transition-colors active:scale-95">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-btn {
  @apply py-4 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02] flex flex-col items-center justify-center space-y-1 font-bold transition-all;
}
.inactive-btn {
  @apply py-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200 flex flex-col items-center justify-center space-y-1 font-bold transition-all;
}
.input-modern {
  @apply w-full px-5 py-3.5 rounded-xl border-2 border-transparent bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none appearance-none font-bold text-gray-800 text-sm cursor-pointer shadow-sm;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}
.date-select {
  @apply w-full px-4 py-3 rounded-xl border-2 border-white bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-gray-800 appearance-none cursor-pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%234338ca' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}
</style>
