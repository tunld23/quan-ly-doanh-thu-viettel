<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
        Lịch sử hoạt động (Audit Logs)
      </h1>
      <button
        @click="fetchLogs"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        :disabled="loading"
      >
        {{ loading ? "Đang tải..." : "Làm mới" }}
      </button>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4"
    >
      <div class="w-full md:w-64">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Tìm kiếm chi tiết</label
        >
        <input
          v-model="filterText"
          type="text"
          placeholder="Tên bảng, chi tiết..."
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div class="w-full md:w-48">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Hành động</label
        >
        <select
          v-model="filterAction"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Tất cả</option>
          <option value="IMPORT">Nhập Doanh Thu</option>
          <option value="IMPORT_SALES">Nhập Thuê Bao</option>
          <option value="CREATE">Tạo Điều chỉnh</option>
          <option value="DELETE">Xóa Điều chỉnh</option>
          <option value="CREATE_TARGET">Nhập Chỉ tiêu</option>
          <option value="DELETE_TARGET">Xóa Chỉ tiêu</option>
        </select>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Thời gian
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Người dùng
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Hành động
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Bảng tác động
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {{ formatDateTime(log.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ log.username }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  ID: {{ log.user_id }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  :class="getActionClass(log.action)"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                >
                  {{ log.action }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {{ log.table_name }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                <div
                  class="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                  :title="log.details"
                >
                  {{ log.details }}
                </div>
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td
                colspan="5"
                class="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                {{
                  loading
                    ? "Đang tải dữ liệu..."
                    : "Không tìm thấy nhật ký nào."
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { userService } from "../services/apiService";

const logs = ref([]);
const loading = ref(false);
const filterText = ref("");
const filterAction = ref("");

const fetchLogs = async () => {
  loading.value = true;
  try {
    const response = await userService.getAuditLogs();
    logs.value = response.data;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    alert(
      "Không thể tải nhật ký hoạt động. Có thể bạn không có quyền superadmin.",
    );
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const matchText =
      !filterText.value ||
      log.details.toLowerCase().includes(filterText.value.toLowerCase()) ||
      log.table_name.toLowerCase().includes(filterText.value.toLowerCase()) ||
      log.username.toLowerCase().includes(filterText.value.toLowerCase());

    const matchAction =
      !filterAction.value || log.action === filterAction.value;

    return matchText && matchAction;
  });
});

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString("vi-VN");
};

const getActionClass = (action) => {
  switch (action) {
    case "IMPORT":
    case "IMPORT_SALES":
    case "CREATE_TARGET":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "DELETE":
    case "DELETE_TARGET":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "CREATE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

onMounted(() => {
  fetchLogs();
});
</script>
