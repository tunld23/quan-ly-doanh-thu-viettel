<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: File,
  accept: { type: String, default: ".xlsx, .xls, .csv, .xlsb, .ods" },
  label: { type: String, default: "Tải lên file dữ liệu" },
});

const emit = defineEmits(["update:modelValue"]);

const fileInput = ref(null);

const handleFileSelect = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    emit("update:modelValue", selectedFile);
  }
};

const handleDrop = (event) => {
  const droppedFile = event.dataTransfer.files[0];
  if (droppedFile) {
    const ext = droppedFile.name.split('.').pop().toLowerCase();
    const supported = ["xlsx", "xls", "csv", "xlsb", "ods"];
    if (supported.includes(ext)) {
      emit("update:modelValue", droppedFile);
    }
  }
};

const removeFile = () => {
  emit("update:modelValue", null);
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<template>
  <div class="mb-8">
    <label class="flex items-center text-sm font-bold text-gray-700 mb-3">
      <svg class="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      {{ label }}
    </label>
    <div
      class="relative border-2 border-dashed rounded-2xl text-center transition-all group cursor-pointer overflow-hidden"
      :class="[modelValue ? 'p-0 border-blue-400 bg-blue-50/30' : 'p-10 border-gray-300 hover:border-blue-400']"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="fileInput.click()"
    >
      <input type="file" ref="fileInput" class="hidden" :accept="accept" @change="handleFileSelect" />
      
      <div v-if="!modelValue" class="space-y-4">
        <div class="flex justify-center">
          <svg class="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-gray-700">Kéo thả file hoặc click để chọn</p>
          <p class="text-sm text-gray-500">Hỗ trợ định dạng Excel (.xlsx, .xls, .csv, .xlsb, .ods)</p>
        </div>
      </div>
      
      <div v-else class="flex items-center justify-between p-8 w-full group/file min-h-[140px]">
        <div class="flex items-center space-x-6 min-w-0 flex-1 px-4">
          <div class="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-2xl flex-shrink-0 transform group-hover/file:scale-110 transition-transform">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="text-left min-w-0 flex-1">
            <p class="text-xl font-black text-gray-800 truncate mb-1" :title="modelValue.name">
              {{ modelValue.name }}
            </p>
            <p class="text-sm text-blue-600 font-bold bg-blue-100/50 inline-block px-3 py-1 rounded-full tracking-wide">
              Dung lượng: {{ (modelValue.size / 1024).toFixed(2) }} KB
            </p>
          </div>
        </div>
        <button
          @click.stop="removeFile"
          class="mr-6 p-4 hover:bg-red-50 rounded-2xl text-red-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group-hover/file:rotate-90"
          title="Xóa file"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l18 18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
