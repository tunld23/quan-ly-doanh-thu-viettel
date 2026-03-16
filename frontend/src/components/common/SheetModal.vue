<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
  >
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
    >
      <!-- Modal Header -->
      <div class="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 class="text-xl font-bold text-gray-800">Chọn Sheet dữ liệu</h3>
          <p class="text-sm text-gray-500 mt-1 font-medium">{{ fileName }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100"
        >
          <svg
            class="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-8 overflow-y-auto custom-scrollbar">
        <p class="text-[14px] text-gray-600 mb-6 font-medium leading-relaxed">
          Chúng tôi tìm thấy <span class="text-blue-600 font-bold">{{ sheetOptions.length }}</span> sheets trong tệp này. 
          Vui lòng chọn các sheets chứa dữ liệu {{ uploadType === 'products' ? 'Master Data' : 'Doanh thu' }} để tiếp tục:
        </p>

        <div class="grid grid-cols-1 gap-3">
          <label
            v-for="sheet in sheetOptions"
            :key="sheet"
            class="group relative flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md"
            :class="[
              selectedSheets.includes(sheet)
                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-blue-200'
            ]"
          >
            <div
              class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mr-4"
              :class="[
                selectedSheets.includes(sheet)
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200 group-hover:border-blue-400'
              ]"
            >
              <svg
                v-if="selectedSheets.includes(sheet)"
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span
              class="text-[15px] font-bold transition-colors"
              :class="selectedSheets.includes(sheet) ? 'text-blue-700' : 'text-gray-700'"
            >
              {{ sheet }}
            </span>
            <input
              type="checkbox"
              :value="sheet"
              v-model="internalSelected"
              class="absolute opacity-0"
              @change="$emit('update:selectedSheets', internalSelected)"
            />
          </label>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
        <button
          @click="$emit('close')"
          class="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-600 hover:bg-white transition-all border border-gray-200"
        >
          Hủy bỏ
        </button>
        <button
          @click="$emit('submit')"
          :disabled="!selectedSheets.length || isUploading"
          class="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <svg
            v-if="isUploading"
            class="animate-spin h-5 w-5 text-white"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
              fill="none"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ isUploading ? "Đang nạp..." : "Nạp dữ liệu" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  fileName: String,
  sheetOptions: Array,
  selectedSheets: Array,
  uploadType: String,
  isUploading: Boolean
});

const emit = defineEmits(['update:selectedSheets', 'close', 'submit']);

const internalSelected = ref([...props.selectedSheets]);

watch(() => props.selectedSheets, (newVal) => {
  internalSelected.value = [...newVal];
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
