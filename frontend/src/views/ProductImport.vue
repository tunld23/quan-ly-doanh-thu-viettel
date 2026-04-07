<script setup>
import { ref } from "vue";
import { useToast } from "../composables/useToast";
import FileUpload from "../components/common/FileUpload.vue";
import { importService } from "../services/apiService";

const toast = useToast();

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

const selectedYear = ref(currentYear);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedDay = ref(new Date().getDate());
const selectedSource = ref("dealer");
const file = ref(null);
const importing = ref(false);

const handleImport = async () => {
  if (!file.value) return;

  importing.value = true;
  const formData = new FormData();
  formData.append("file", file.value);
  formData.append("month", selectedMonth.value);
  formData.append("year", selectedYear.value);
  formData.append("day", selectedDay.value);
  formData.append("source", selectedSource.value);

  try {
    const response = await importService.importProducts(formData);
    toast.success(response.data.message);
    file.value = null; 
  } catch (err) {
    toast.error(err.response?.data?.error || "Có lỗi xảy ra khi import sản phẩm");
    console.error(err);
  } finally {
    importing.value = false;
  }
};
</script>

<template>
  <div class="product-import-container p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 uppercase tracking-tight">
        Quản lý Sản phẩm (Import)
      </h1>

      <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="space-y-2">
            <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3 ml-1">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              1. Chọn Ngày
            </label>
            <select v-model="selectedDay" class="input-modern">
              <option v-for="d in 31" :key="d" :value="d">Ngày {{ d }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3 ml-1">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              2. Chọn Tháng
            </label>
            <select v-model="selectedMonth" class="input-modern">
              <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3 ml-1">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              3. Chọn Năm
            </label>
            <select v-model="selectedYear" class="input-modern">
               <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
            </select>
          </div>
        </div>

        <div class="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
          <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-4 ml-1">
            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            3. Chọn Kênh nạp dữ liệu
          </label>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="selectedSource = 'dealer'"
              :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource !== 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
            >
              <span class="text-xs uppercase tracking-widest">Đại Lý</span>
              <span class="text-[10px] font-normal opacity-70 italic">Ủy Quyền</span>
            </button>
            <button
              @click="selectedSource = 'am'"
              :class="`py-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-1 ${selectedSource === 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'}`"
            >
              <span class="text-xs uppercase tracking-widest">AM</span>
              <span class="text-[10px] font-normal opacity-70 italic">Account Manager</span>
            </button>
          </div>
        </div>

        <div class="mb-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
           <div class="flex items-start space-x-3 text-xs text-blue-800 leading-relaxed">
             <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <div>
               <p class="font-black uppercase tracking-widest mb-2">Quy ước nạp Sản phẩm:</p>
               <ul class="space-y-1 ml-1">
                 <li class="flex items-center gap-1.5"><div class="w-1 h-1 bg-blue-400 rounded-full"></div> <b>Mã hàng:</b> Cột B | <b>Mặt hàng:</b> Cột C</li>
                 <li class="flex items-center gap-1.5"><div class="w-1 h-1 bg-blue-400 rounded-full"></div> <b>Doanh thu:</b> Cột K, L, M | <b>Nhân viên:</b> Cột AB</li>
                 <li class="flex items-center gap-1.5"><div class="w-1 h-1 bg-blue-400 rounded-full"></div> <b>Trạng thái (Hủy):</b> Cột AD</li>
                 <li class="flex items-center gap-1.5"><div class="w-1 h-1 bg-blue-400 rounded-full"></div> <b>Product Hierarchy:</b> Cột <b>AP</b></li>
               </ul>
             </div>
           </div>
        </div>

        <FileUpload v-model="file" label="4. Tải lên file dữ liệu" />

        <div class="flex justify-end pt-5 border-t border-gray-50">
          <button
            @click="handleImport"
            :disabled="!file || importing"
            class="px-10 py-4 bg-blue-600 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all flex items-center space-x-3 uppercase tracking-[0.2em] text-xs"
          >
            <span v-if="importing">Đang xử lý...</span>
            <span v-else>Bắt đầu Nạp dữ liệu</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modern {
  @apply w-full px-5 py-3.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none appearance-none font-bold text-gray-800 text-sm cursor-pointer shadow-sm;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}
</style>
