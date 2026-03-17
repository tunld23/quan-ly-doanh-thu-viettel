<template>
  <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup 
      name="toast" 
      tag="div" 
      class="flex flex-col gap-3"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-center p-4 min-w-[300px] max-w-md rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-500"
        :class="[
          toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' : 
          toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
          toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-800' :
          'bg-blue-50/90 border-blue-200 text-blue-800'
        ]"
      >
        <div class="mr-3 flex-shrink-0">
          <svg v-if="toast.type === 'success'" class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="toast.type === 'error'" class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1 text-sm font-bold">
          {{ toast.message }}
        </div>
        <button 
          @click="removeToast(toast.id)" 
          class="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
}
.toast-move {
  transition: all 0.4s ease;
}
</style>
