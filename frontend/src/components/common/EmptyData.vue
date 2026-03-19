<template>
  <div class="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
    <div class="w-40 h-40 mb-8 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100 relative group overflow-visible">
      <div class="absolute inset-0 bg-blue-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-20"></div>
      
      <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-200 transition-colors group-hover:text-blue-200 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 2v-6m-8 4h8m-1 9l-1 1H7l-1-1V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      
      <div class="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl shadow-lg border-4 border-white transform transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
    
    <h4 class="text-2xl font-black text-gray-800 mb-3 uppercase tracking-tight">
      {{ title }}
    </h4>
    <p class="text-gray-400 max-w-sm font-medium px-6 leading-relaxed">
      {{ message }}
    </p>
    
    <slot name="action"></slot>
  </div>
</template>

<script setup>


defineProps({
  title: {
    type: String,
    default: 'Không tìm thấy dữ liệu'
  },
  message: {
    type: String,
    default: 'Vui lòng thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác để xem thông tin thống kê.'
  }
});
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-in {
  animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
