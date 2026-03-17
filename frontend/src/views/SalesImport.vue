<template>
  <div class="product-import-container p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
        Quản lý Detail (Import Sales)
      </h1>

      <div
        class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 backdrop-blur-sm bg-white/90"
      >
        <!-- Top Row: Source and Type Selection -->
        <div class="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
          <div class="space-y-6">
            <!-- 1. Source Selection -->
            <div>
              <label
                class="flex items-center text-sm font-black uppercase tracking-wider text-gray-700 mb-4"
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
                  :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource === 'dealer' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
                >
                  <span class="text-sm uppercase tracking-widest">Đại Lý</span>
                  <span class="text-xs font-normal opacity-70">Ủy Quyền</span>
                </button>
                <button
                  @click="selectedSource = 'am'"
                  :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource === 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
                >
                  <span class="text-sm uppercase tracking-widest">AM</span>
                  <span class="text-xs font-normal opacity-70"
                    >Account Manager</span
                  >
                </button>
              </div>
            </div>

            <!-- 2. Type Selection -->
            <div class="pt-6 border-t border-gray-100">
              <label
                class="flex items-center text-sm font-black uppercase tracking-wider text-gray-700"
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
                2. Chọn Nhóm Sản phẩm để Import
              </label>

              <div class="relative mt-4">
                <select
                  v-model="selectedType"
                  class="w-full pl-6 pr-10 py-5 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none font-bold text-gray-800 text-lg cursor-pointer"
                >
                  <option value="" disabled>-- Nhấp để chọn nhóm --</option>
                  <option
                    v-for="group in productGroups"
                    :key="group"
                    :value="group"
                  >
                    {{ group }}
                  </option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div
                class="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-700 leading-relaxed"
              >
                <p class="font-bold flex items-center mb-1">
                  <svg
                    class="w-4 h-4 mr-1"
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
                  Quy ước lấy dữ liệu cho nhóm:
                  <span class="ml-1 text-blue-900">{{
                    selectedType || "..."
                  }}</span>
                </p>
                <ul
                  v-if="selectedType === 'CA'"
                  class="list-disc ml-5 space-y-1"
                >
                  <li><b>Tháng/Năm:</b> Cột <b>Q</b> (Ngày đấu nối)</li>
                  <li><b>Nhân viên:</b> Cột <b>Z</b> (Nhân viên đấu nối)</li>
                  <li><b>Sản phẩm:</b> Cột <b>W</b> (Mã-Mặt hàng)</li>
                </ul>
                <ul
                  v-else-if="
                    selectedType === 'HDDT' || selectedType === 'E-Invoice'
                  "
                  class="list-disc ml-5 space-y-1"
                >
                  <li><b>Tháng/Năm:</b> Cột <b>AE</b> (Ngày hòa mạng)</li>
                  <li><b>Nhân viên:</b> Cột <b>AA</b> (Nhân viên đấu nối)</li>
                  <li>
                    <b>Sản phẩm:</b> Cột <b>Q</b> (Mã) & <b>R</b> (Tên hàng)
                  </li>
                </ul>
                <ul
                  v-else-if="selectedType === 'vBHXH'"
                  class="list-disc ml-5 space-y-1"
                >
                  <li><b>Tháng/Năm:</b> Cột <b>AA</b> (Ngày hòa mạng)</li>
                  <li><b>Nhân viên:</b> Cột <b>W</b> (Nhân viên đấu nối)</li>
                  <li><b>Sản phẩm:</b> Cột <b>P</b> (Loại TB-Gói cước)</li>
                </ul>
                <ul
                  v-else-if="selectedType === 'MySign'"
                  class="list-disc ml-5 space-y-1"
                >
                  <li><b>Tháng/Năm:</b> Cột <b>X</b> (Ngày tạo TB)</li>
                  <li><b>Nhân viên:</b> Cột <b>AA</b> (Nhân viên đấu nối)</li>
                  <li>
                    <b>Sản phẩm:</b> Cột <b>R</b> (Mã) & <b>T</b> (Gói cước)
                  </li>
                </ul>
                <ul
                  v-else-if="selectedType === 'EasyBooks'"
                  class="list-disc ml-5 space-y-1"
                >
                  <li>
                    <b>Điều kiện:</b> Chỉ lấy dòng có Cột <b>C</b> là <b>HNI</b>
                  </li>
                  <li><b>Tháng/Năm:</b> Cột <b>P</b> (Ngày đấu nối)</li>
                  <li><b>Nhân viên:</b> Cột <b>O</b> (Nhân viên đấu nối)</li>
                  <li><b>Sản phẩm:</b> Cột <b>K</b> (Gói cước)</li>
                </ul>
                <ul
                  v-else-if="selectedType === 'Internet Truyền hình'"
                  class="list-disc ml-5 space-y-1"
                >
                  <li>
                    <b>Điều kiện:</b> Chỉ lấy dòng có Cột <b>AL</b> là
                    <b>HNI</b>
                  </li>
                  <li><b>Tháng/Năm:</b> Cột <b>AE</b> (Ngày đấu nối)</li>
                  <li><b>Nhân viên:</b> Cột <b>AT</b> (User đấu nối)</li>
                  <li>
                    <b>Sản phẩm:</b> Cột <b>Y</b> (Loại hòa mạng - Mã-Mặt hàng)
                  </li>
                </ul>
                <ul
                  v-else-if="
                    ['Tendoo', 'vContract', 'vTracking'].includes(selectedType)
                  "
                  class="list-disc ml-5 space-y-1"
                >
                  <li>
                    <b>Điều kiện:</b> Cột <b>AR</b> phải chứa giá trị tương ứng
                    (Hợp đồng điện tử, PMQLBH_Tendoo, V-Tracking)
                  </li>
                  <li><b>Tháng/Năm:</b> Chọn thủ công ở trên</li>
                  <li><b>Mã hàng:</b> Cột <b>B</b></li>
                  <li><b>Mặt hàng:</b> Cột <b>C</b></li>
                  <li><b>Số lượng (Amount):</b> Cột <b>E</b></li>
                </ul>
                <p v-else class="italic">
                  Vui lòng chọn nhóm sản phẩm để xem quy ước cột chi tiết.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2.5 Manual Date Selection for specific AM types -->
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
              <div class="relative">
                <select
                  v-model="manualMonth"
                  class="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-white bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-gray-800 appearance-none cursor-pointer"
                >
                  <option
                    v-for="m in 12"
                    :key="m"
                    :value="String(m).padStart(2, '0')"
                  >
                    Tháng {{ m }}
                  </option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-indigo-400"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label
                class="block text-[11px] font-black text-indigo-900/60 uppercase tracking-[0.1em] ml-1"
                >Năm</label
              >
              <div class="relative">
                <select
                  v-model="manualYear"
                  class="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-white bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-gray-800 appearance-none cursor-pointer"
                >
                  <option v-for="y in availableYears" :key="y" :value="y">
                    Năm {{ y }}
                  </option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-indigo-400"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Upload Area -->
        <div class="mb-8">
          <label class="flex items-center text-sm font-bold text-gray-700 mb-3">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            3. Tải lên file dữ liệu
          </label>
          <div
            class="relative border-2 border-dashed rounded-2xl text-center transition-all group cursor-pointer overflow-hidden"
            :class="[
              file
                ? 'p-0 border-blue-400 bg-blue-50/30'
                : 'p-10 border-gray-300 hover:border-blue-400',
            ]"
            @dragover.prevent
            @drop.prevent="handleDrop"
            @click="$refs.fileInput.click()"
          >
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".xlsx, .xls"
              @change="handleFileSelect"
            />
            <div v-if="!file" class="space-y-4">
              <div class="flex justify-center">
                <svg
                  class="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-lg font-medium text-gray-700">
                  Kéo thả file hoặc click để chọn
                </p>
                <p class="text-sm text-gray-500">
                  Hỗ trợ định dạng Excel (.xlsx, .xls)
                </p>
              </div>
            </div>
            <div
              v-else
              class="flex items-center justify-between p-8 w-full group/file min-h-[140px]"
            >
              <div class="flex items-center space-x-6 min-w-0 flex-1 px-4">
                <div
                  class="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-2xl flex-shrink-0 transform group-hover/file:scale-110 transition-transform"
                >
                  <svg
                    class="w-10 h-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="text-left min-w-0 flex-1">
                  <p
                    class="text-xl font-black text-gray-800 truncate mb-1"
                    :title="file.name"
                  >
                    {{ file.name }}
                  </p>
                  <p
                    class="text-sm text-blue-600 font-bold bg-blue-100/50 inline-block px-3 py-1 rounded-full tracking-wide"
                  >
                    Tiền tố: {{ (file.size / 1024).toFixed(2) }} KB
                  </p>
                </div>
              </div>
              <button
                @click.stop="file = null"
                class="mr-6 p-4 hover:bg-red-50 rounded-2xl text-red-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group-hover/file:rotate-90"
                title="Xóa file"
              >
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M6 18L18 6M6 6l18 18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex justify-end">
          <button
            @click="handleImport"
            :disabled="!file || importing || !selectedType"
            class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform active:scale-95 transition-all flex items-center space-x-2"
          >
            <svg
              v-if="importing"
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{{
              importing ? "Đang Import Detail..." : "Import Detail"
            }}</span>
          </button>
        </div>
      </div>

      <!-- Result Message removed - using toasts now -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useToast } from "../composables/useToast";

const toast = useToast();

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const productGroupsMap = {
  dealer: ["CA", "HDDT", "vBHXH"],
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
    const response = await axios.get(`${API_BASE}/product/years`);
    availableYears.value = response.data;
    if (
      availableYears.value.length > 0 &&
      !availableYears.value.includes(manualYear.value)
    ) {
      manualYear.value = availableYears.value[0];
    }
  } catch (err) {
    console.error("Lỗi lấy danh sách năm:", err);
    availableYears.value = [String(new Date().getFullYear())];
  }
};

onMounted(() => {
  fetchYears();
});

const requiresManualDate = computed(() => {
  return ["Tendoo", "vContract", "vTracking"].includes(selectedType.value);
});

// Tự động cập nhật danh sách nhóm dựa trên kênh nạp
const productGroups = computed(
  () => productGroupsMap[selectedSource.value] || [],
);

// Reset nhóm sản phẩm nếu không thuộc kênh mới
watch(selectedSource, (newSource) => {
  if (!productGroupsMap[newSource].includes(selectedType.value)) {
    selectedType.value = "";
  }
});

const handleFileSelect = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
  }
};

const handleDrop = (event) => {
  const droppedFile = event.dataTransfer.files[0];
  if (
    droppedFile &&
    (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))
  ) {
    file.value = droppedFile;
  }
};

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
    const response = await axios.post(`${API_BASE}/sales/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success(response.data.message);
    file.value = null; // Reset file after success
  } catch (err) {
    const errorMsg =
      err.response?.data?.error || "Có lỗi xảy ra khi import detail";
    toast.error(errorMsg);
    console.error(err);
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
