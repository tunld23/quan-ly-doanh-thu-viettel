<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const errorMsg = ref("");
const loading = ref(false);

const handleLogin = async () => {
  errorMsg.value = "";
  loading.value = true;
  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });
    router.push("/");
  } catch (err) {
    if (err.response?.data?.message) {
      errorMsg.value = err.response.data.message;
    } else {
      errorMsg.value = "Đăng nhập thất bại, vui lòng thử lại";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen relative flex items-center justify-center bg-cover bg-center bg-no-repeat"
    style="background-image: url(&quot;/bg_login.jpg&quot;)"
  >
    <!-- White Overlay Film -->
    <div class="absolute inset-0 bg-white/60"></div>

    <!-- Form Container (No separate background as per design) -->
    <div class="relative z-10 w-full max-w-[380px] px-4 pb-20">
      <!-- Logo -->
      <div class="text-center mb-6">
        <img
          src="/LoginBanner_white.png"
          alt="Viettel"
          class="mx-auto h-[70px] object-contain drop-shadow"
        />
      </div>

      <h2
        class="text-center text-[22px] font-semibold text-gray-800 mb-6 drop-shadow-sm"
      >
        Hệ Thống Quản Trị Viettel Hà Nội
      </h2>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Tên truy cập -->
        <div>
          <label
            for="username"
            class="block text-[13px] font-medium text-gray-800 mb-1 drop-shadow-sm"
            >Tên truy cập:</label
          >
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="block w-full px-3 py-1.5 bg-white border-2 border-gray-300 rounded-[5px] focus:outline-none focus:border-gray-500 transition-colors shadow-sm text-sm"
          />
        </div>

        <!-- Mật khẩu -->
        <div>
          <label
            for="password"
            class="block text-[13px] font-medium text-gray-800 mb-1 drop-shadow-sm"
            >Mật khẩu:</label
          >
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="block w-full px-3 py-1.5 bg-white border-2 border-gray-900 rounded-[5px] focus:outline-none focus:border-red-600 transition-colors shadow-sm text-sm"
          />
        </div>

        <!-- Ghi nhớ -->
        <div class="flex items-center pt-1">
          <input
            id="remember_me"
            v-model="rememberMe"
            type="checkbox"
            class="h-[14px] w-[14px] text-red-600 focus:ring-0 border-gray-400 rounded-[3px] bg-white cursor-pointer"
          />
          <label
            for="remember_me"
            class="ml-2 block text-[13px] text-gray-800 cursor-pointer drop-shadow-sm"
          >
            Ghi nhớ
          </label>
        </div>

        <div
          v-if="errorMsg"
          class="text-[#e60028] text-sm text-center font-medium bg-white/70 rounded px-2 py-1"
        >
          {{ errorMsg }}
        </div>

        <!-- Button -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-[15px] font-bold rounded-full text-white bg-[#df0024] hover:bg-[#c4001f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all shadow-md"
          >
            <span v-if="loading">Đang tải...</span>
            <span v-else>Đăng nhập</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
