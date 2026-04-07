<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

defineProps({
  isOpen: Boolean,
  currentPath: String,
});

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const menuItems = [
  {
    path: "/",
    name: "Dashboard",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    roles: ["admin", "superadmin", "user"],
  },
  {
    path: "/sme-kpi",
    name: "Hiệu suất",
    icon: "M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM7 8a1 1 0 012-1h6a1 1 0 110 2H9a1 1 0 01-1-1zM5 13a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zM5 18a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z",
    roles: ["admin", "superadmin", "user"],
  },
  {
    path: "/products",
    name: "Nhập Sản phẩm",
    icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    roles: ["admin", "superadmin"],
  },
  {
    path: "/sales-import",
    name: "Nhập Detail",
    icon: "M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    roles: ["admin", "superadmin"],
  },
  {
    path: "/adjustments",
    name: "Điều chỉnh Doanh thu",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    roles: ["admin", "superadmin"],
  },
  {
    path: "/targets",
    name: "Nhập Chỉ tiêu",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    roles: ["admin", "superadmin"],
  },
  {
    path: "/users",
    name: "Quản lý Account",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    roles: ["superadmin"],
  },
  {
    path: "/audit-logs",
    name: "Lịch sử Hoạt động",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    roles: ["superadmin"],
  },
];

const filteredMenuItems = computed(() => {
  const userRole = authStore.user?.role || "user";
  return menuItems.filter((item) => item.roles.includes(userRole));
});
</script>

<template>
  <aside
    class="bg-[#0f172a] text-gray-300 w-72 flex-shrink-0 transition-all duration-300 flex flex-col z-20 shadow-2xl"
    :class="
      isOpen
        ? 'translate-x-0'
        : '-translate-x-full absolute md:relative md:translate-x-0 md:w-0 overflow-hidden'
    "
  >
    <!-- LOGO SECTION -->
    <div class="h-24 flex items-center border-b border-white/5 px-6">
      <div v-if="isOpen" class="flex items-center gap-4">
        <!-- Logo Icon Box - Zoomed up -->
        <div
          class="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center p-1 shadow-lg shadow-black/20"
        >
          <img
            src="/LoginBanner_white.png"
            alt="Viettel"
            class="w-full h-full object-contain"
          />
        </div>
        <!-- Brand Name -->
        <div class="flex flex-col">
          <span
            class="text-2xl font-black text-white tracking-tight leading-tight"
            >Viettel Hanoi</span
          >
        </div>
      </div>
    </div>

    <!-- MENU NAVIGATION -->
    <nav class="flex-1 py-8 overflow-y-auto custom-scrollbar">
      <ul class="space-y-3 px-4">
        <li v-for="item in filteredMenuItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center px-4 py-3.5 rounded-2xl group transition-all duration-200"
            active-class="bg-[#ee0033] text-white shadow-lg shadow-red-600/30 scale-105"
            :class="[
              !isOpen ? 'md:justify-center px-0' : '',
              currentPath !== item.path
                ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                : '',
            ]"
          >
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="item.icon"
              />
            </svg>
            <span v-if="isOpen" class="ml-4 font-bold text-sm tracking-wide">{{
              item.name
            }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- USER & LOGOUT SECTION -->
    <div class="p-6 border-t border-white/5 space-y-4 bg-black/10">
      <div class="flex items-center" v-if="isOpen">
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ee0033] to-red-400 p-0.5 shadow-lg"
        >
          <div
            class="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center text-xs font-black text-white"
          >
            {{ authStore.user?.username?.substring(0, 2).toUpperCase() || "U" }}
          </div>
        </div>
        <div class="ml-4 truncate">
          <p class="text-xs font-black text-white uppercase tracking-widest">
            {{ authStore.user?.username }}
          </p>
          <div class="flex items-center gap-1.5">
            <div
              class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
            ></div>
            <p class="text-[10px] font-bold text-slate-500 uppercase">
              {{ authStore.user?.role }}
            </p>
          </div>
        </div>
      </div>

      <button
        @click="handleLogout"
        class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span v-if="isOpen">Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
