<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "./components/layout/Sidebar.vue";
import Header from "./components/layout/Header.vue";

const route = useRoute();
const isSidebarOpen = ref(true);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar :is-open="isSidebarOpen" :current-path="route.path" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#f0f2f5] overflow-hidden">
      <!-- Top header -->
      <Header :is-sidebar-open="isSidebarOpen" @toggle-sidebar="toggleSidebar" />

      <!-- Main scrollable content -->
      <main class="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
/* Global fade transitions or common styles can go here */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
