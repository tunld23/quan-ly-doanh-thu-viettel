<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

defineProps({
  isOpen: Boolean,
  currentPath: String
});

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const menuItems = [
  { path: '/', name: 'Dashboard', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', roles: ['admin', 'user'] },
  { path: '/products', name: 'Nhập Sản phẩm', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', roles: ['admin'] },
  { path: '/sales-import', name: 'Nhập Detail', icon: 'M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['admin'] },
  { path: '/adjustments', name: 'Điều chỉnh Doanh thu', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', roles: ['admin'] },
  { path: '/targets', name: 'Nhập Chỉ tiêu', icon: 'M13 10V3L4 14h7v7l9-11h-7z', roles: ['admin'] }
];

const filteredMenuItems = computed(() => {
  const userRole = authStore.user?.role || 'user';
  return menuItems.filter(item => item.roles.includes(userRole));
});
</script>

<template>
  <aside
    class="bg-white text-gray-800 border-r border-gray-200 w-64 flex-shrink-0 transition-all duration-300 flex flex-col z-20"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full absolute md:relative md:translate-x-0 md:w-0 overflow-hidden'"
  >
    <div class="h-16 flex items-center justify-center border-b border-gray-100 px-4">
      <div v-if="isOpen" class="flex items-center justify-center w-full h-full py-2">
        <img src="/LoginBanner_white.png" alt="Viettel" class="h-full object-contain max-h-[48px]" />
      </div>
    </div>

    <nav class="flex-1 py-6">
      <ul class="space-y-2 px-3">
        <li v-for="item in filteredMenuItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg group transition-colors"
            active-class="bg-red-50 text-[#e03] font-bold"
            :class="[
              !isOpen ? 'md:justify-center px-0' : '',
              currentPath !== item.path ? 'text-gray-500 hover:bg-gray-50 hover:text-[#e03]' : ''
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

    <div class="p-4 border-t border-gray-100 flex flex-col items-center gap-4 bg-gray-50/50">
      <div class="flex items-center w-full" :class="!isOpen ? 'md:justify-center' : ''">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#e03] to-red-400 border border-red-200 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
          {{ authStore.user?.username?.substring(0,2).toUpperCase() || 'U' }}
        </div>
        <div v-if="isOpen" class="ml-3 truncate flex-1">
          <p class="text-sm font-semibold text-gray-800 truncate">{{ authStore.user?.username || 'Người dùng' }}</p>
          <p class="text-xs text-gray-500 truncate">{{ authStore.user?.role || 'Khách' }}</p>
        </div>
      </div>
      <button 
        @click="handleLogout" 
        class="w-full text-sm text-gray-600 hover:text-[#e03] flex items-center justify-center bg-white hover:bg-red-50 border border-gray-200 hover:border-red-100 py-2 rounded-lg transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="isOpen" class="ml-2 font-medium">Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>
