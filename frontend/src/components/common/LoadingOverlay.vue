<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md transition-all duration-500"
    >
      <div class="relative">
        <!-- Main Spinner -->
        <div
          class="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"
        ></div>
        <!-- Pulse Effect -->
        <div
          class="absolute inset-0 w-24 h-24 border-4 border-blue-400 rounded-full animate-ping opacity-20"
        ></div>
      </div>

      <div class="mt-8 text-center space-y-3">
        <h3 class="text-2xl font-bold text-gray-800 animate-pulse">
          Đang chuẩn bị dữ liệu...
        </h3>
        <p class="text-gray-500 font-medium tracking-wide">
          Hệ thống đang xử lý các tệp Excel (Doanh thu & HDDT)
        </p>
        <div
          class="flex items-center justify-center gap-2 text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-1.5 rounded-full mx-auto w-fit border border-blue-100 mt-2"
        >
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
          {{ statusText }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: Boolean,
  statusText: String
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
