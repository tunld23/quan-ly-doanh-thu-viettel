<template>
  <div class="product-import-container p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
        Quản lý Sản phẩm (Import)
      </h1>

      <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Year Selection -->
          <div class="space-y-2">
            <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              1. Chọn Năm
            </label>
            <select
              v-model="selectedYear"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50"
            >
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Month Selection -->
          <div class="space-y-2">
            <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              2. Chọn Tháng
            </label>
            <select
              v-model="selectedMonth"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50"
            >
              <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
            </select>
          </div>
        </div>

        <!-- Source Selection -->
        <div class="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
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
            3. Chọn Kênh nạp dữ liệu
          </label>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="selectedSource = 'dealer'"
              :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource !== 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
            >
              <span class="text-sm uppercase tracking-widest">Đại Lý</span>
              <span class="text-xs font-normal opacity-70">Ủy Quyền</span>
            </button>
            <button
              @click="selectedSource = 'am'"
              :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource === 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
            >
              <span class="text-sm uppercase tracking-widest">AM</span>
              <span class="text-xs font-normal opacity-70">Account Manager</span>
            </button>
          </div>
        </div>
        <!-- Note about columns -->
        <div class="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div class="flex items-start space-x-3">
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
            <div class="text-sm text-blue-800">
              <p class="font-bold mb-1 uppercase text-xs">
                Quy ước nạp Sản phẩm:
              </p>
              <ul class="list-disc ml-4 space-y-1">
                <li><b>Mã hàng:</b> Cột B | <b>Mặt hàng:</b> Cột C</li>
                <li><b>Tiền VAT:</b> Cột K, L, M | <b>Số lượng:</b> Cột E</li>
                <li v-if="selectedSource === 'dealer'">
                  <b>Dòng sản phẩm:</b> Lấy tại cột <b>AS</b> (Dành cho Đại lý)
                </li>
                <li v-else>
                  <b>Dòng sản phẩm:</b> Lấy tại cột <b>AR</b> (Dành cho AM)
                </li>
              </ul>
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
            4. Tải lên file dữ liệu
          </label>
          <div
            class="relative border-2 border-dashed rounded-2xl text-center transition-all group cursor-pointer overflow-hidden"
            :class="[
              file 
                ? 'p-0 border-blue-400 bg-blue-50/30' 
                : 'p-10 border-gray-300 hover:border-blue-400'
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
            <div v-else class="flex items-center justify-between p-8 w-full group/file min-h-[140px]">
              <div class="flex items-center space-x-6 min-w-0 flex-1 px-4">
                <div class="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-2xl flex-shrink-0 transform group-hover/file:scale-110 transition-transform">
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
                  <p class="text-xl font-black text-gray-800 truncate mb-1" :title="file.name">
                    {{ file.name }}
                  </p>
                  <p class="text-sm text-blue-600 font-bold bg-blue-100/50 inline-block px-3 py-1 rounded-full tracking-wide">
                    Dung lượng: {{ (file.size / 1024).toFixed(2) }} KB
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
            :disabled="!file || importing"
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
            <span>{{ importing ? "Đang Insert..." : "Insert" }}</span>
          </button>
        </div>
      </div>

      <!-- Result Message removed - using toasts now -->
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useToast } from "../composables/useToast";

const toast = useToast();

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

const selectedYear = ref(currentYear);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedSource = ref("dealer");
const file = ref(null);
const importing = ref(false);

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
  if (!file.value) return;

  importing.value = true;

  const formData = new FormData();
  formData.append("file", file.value);
  formData.append("month", selectedMonth.value);
  formData.append("year", selectedYear.value);
  formData.append("source", selectedSource.value);

  try {
    const response = await axios.post(`${API_BASE}/products/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success(response.data.message);
    file.value = null; // Reset file after success
  } catch (err) {
    const errorMsg = err.response?.data?.error || "Có lỗi xảy ra khi import sản phẩm";
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
