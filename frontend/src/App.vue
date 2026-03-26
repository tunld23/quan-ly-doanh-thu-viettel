<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "./components/layout/Sidebar.vue";
import Header from "./components/layout/Header.vue";
import ToastContainer from "./components/common/ToastContainer.vue";
import { useAuthStore } from "./stores/auth";

const route = useRoute();
const authStore = useAuthStore();
const isSidebarOpen = ref(true);

onMounted(() => {
  authStore.tryAutoLogin();
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Only show Layout components if user is authenticated and not on the login page
const showLayout = computed(() => {
  return route.name !== 'login' && authStore.isAuthenticated;
});
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
    <!-- Toast Layer -->
    <ToastContainer />

    <!-- Show layout wrapper if authenticated and not login page -->
    <template v-if="showLayout">
      <!-- Sidebar -->
      <Sidebar :is-open="isSidebarOpen" :current-path="route.path" />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 bg-[#f0f2f5] overflow-hidden">
        <!-- Top header -->
        <Header
          :is-sidebar-open="isSidebarOpen"
          @toggle-sidebar="toggleSidebar"
        />

        <!-- Main scrollable content -->
        <main class="flex-1 overflow-x-hidden p-0">
          <router-view />
        </main>
      </div>
    </template>
    
    <!-- Without layout for login pg -->
    <template v-else>
      <router-view class="w-full h-full" />
    </template>
  </div>
</template>

<style>
/* Global fade transitions or common styles can go here */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
