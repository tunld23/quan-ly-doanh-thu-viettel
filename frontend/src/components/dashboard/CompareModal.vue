<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="$emit('update:show', false)"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-[19px] font-black text-slate-800 flex items-center gap-3">
             <div class="bg-blue-600 p-2 rounded-xl text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
             </div>
             So sánh các năm
          </h3>
          <button @click="$emit('update:show', false)" class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-8 space-y-8">
          <!-- Selection Section -->
          <div>
            <label class="block text-[13px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 text-center">Chọn chế độ so sánh</label>
            <div class="grid grid-cols-2 gap-4">
              <button 
                @click="localMode = 'quarter'" 
                class="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group"
                :class="localMode === 'quarter' ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/10' : 'border-gray-100 hover:border-blue-200'"
              >
                <div class="w-12 h-12 rounded-full flex items-center justify-center transition-colors" :class="localMode === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'">
                  <span class="font-black text-lg">Q</span>
                </div>
                <span class="text-sm font-bold" :class="localMode === 'quarter' ? 'text-blue-700' : 'text-gray-600'">Theo Quý</span>
              </button>

              <button 
                @click="localMode = 'month'" 
                class="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group"
                :class="localMode === 'month' ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/10' : 'border-gray-100 hover:border-blue-200'"
              >
                 <div class="w-12 h-12 rounded-full flex items-center justify-center transition-colors" :class="localMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'">
                  <span class="font-black text-lg">M</span>
                </div>
                <span class="text-sm font-bold" :class="localMode === 'month' ? 'text-blue-700' : 'text-gray-600'">Theo Tháng</span>
              </button>
            </div>
          </div>

          <!-- Specific Selector -->
          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <label class="block text-[13px] font-bold text-slate-500 mb-3 ml-1">Chọn {{ localMode === 'quarter' ? 'Quý' : 'Tháng' }} cụ thể</label>
            <select v-model="localValue" class="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-700 transition-all shadow-sm">
                <option value="">Tất cả các {{ localMode === 'quarter' ? 'quý' : 'tháng' }}</option>
                <template v-if="localMode === 'quarter'">
                  <option v-for="q in 4" :key="q" :value="String(q)">Quý {{ q }}</option>
                </template>
                <template v-else>
                  <option v-for="m in 12" :key="m" :value="String(m)">Tháng {{ m }}</option>
                </template>
            </select>
            <p class="mt-3 text-[11px] text-slate-400 font-medium italic">* Biểu đồ sẽ hiển thị dữ liệu so sánh các năm có trong hệ thống.</p>
          </div>
        </div>

        <div class="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button @click="$emit('update:show', false)" class="flex-1 py-4 px-6 rounded-2xl text-[15px] font-black text-slate-500 hover:bg-white hover:shadow-md transition-all">Đóng</button>
          <button @click="handleSubmit" class="flex-2 py-4 px-10 rounded-2xl text-[15px] font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Xem kết quả</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  currentMode: String,
  currentValue: String
});

const emit = defineEmits(['update:show', 'compare']);

const localMode = ref('quarter');
const localValue = ref('');

watch(() => props.show, (newVal) => {
  if (newVal) {
    localMode.value = props.currentMode === 'all' ? 'quarter' : props.currentMode;
    localValue.value = props.currentValue;
  }
});

const handleSubmit = () => {
  // First emit close to ensure modal disappears immediately
  emit('update:show', false);
  
  // Then emit compare event
  emit('compare', {
    mode: localMode.value,
    value: localValue.value
  });
};

// Reset value when mode changes to prevent cross-mode pollution
watch(localMode, () => {
  localValue.value = "";
});
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>
