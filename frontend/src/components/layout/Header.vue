<script setup>
defineProps({
  isSidebarOpen: Boolean
});

defineEmits(['toggleSidebar']);
</script>

<template>
  <header class="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-100 z-10">
    <div class="flex items-center">
      <button
        @click="$emit('toggleSidebar')"
        class="text-gray-500 hover:text-[#e03] focus:outline-none transition-colors p-1 rounded-md hover:bg-red-50"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <div class="flex items-center space-x-3 sm:space-x-5">
      <button class="relative text-gray-500 hover:text-[#e03] p-1.5 rounded-full hover:bg-red-50 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#e03] ring-2 ring-white shadow-sm"></span>
      </button>

      <button class="relative text-gray-500 hover:text-[#e03] p-1.5 rounded-full hover:bg-red-50 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  </header>
</template>
