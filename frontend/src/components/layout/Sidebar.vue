<script setup>
defineProps({
  isOpen: Boolean,
  currentPath: String
});

const menuItems = [
  { path: '/', name: 'Dashboard', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { path: '/products', name: 'Nhập Sản phẩm', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { path: '/sales-import', name: 'Nhập Detail', icon: 'M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/adjustments', name: 'Điều chỉnh Doanh thu', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { path: '/targets', name: 'Nhập Chỉ tiêu', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
];
</script>

<template>
  <aside
    class="bg-slate-900 text-white w-64 flex-shrink-0 transition-all duration-300 flex flex-col shadow-xl z-20"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full absolute md:relative md:translate-x-0 md:w-0 overflow-hidden'"
  >
    <div class="h-16 flex items-center justify-center border-b border-slate-800 px-4">
      <div v-if="isOpen" class="flex items-center space-x-3 w-full font-bold text-xl tracking-wide">
        <div class="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span><span class="text-blue-500">Admin</span></span>
      </div>
    </div>

    <nav class="flex-1 py-6">
      <ul class="space-y-2 px-3">
        <li v-for="item in menuItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg group transition-colors"
            active-class="bg-blue-600/10 text-blue-400 font-medium"
            :class="[
              !isOpen ? 'md:justify-center px-0' : '',
              currentPath !== item.path ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : ''
            ]"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span v-if="isOpen" class="ml-3 font-medium">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-slate-800">
      <div class="flex items-center" :class="!isOpen ? 'md:justify-center' : ''">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-inner">
          AD
        </div>
        <div v-if="isOpen" class="ml-3">
          <p class="text-sm font-medium text-white">Quản trị viên</p>
        </div>
      </div>
    </div>
  </aside>
</template>
