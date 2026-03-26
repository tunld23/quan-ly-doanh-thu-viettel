<script setup>
import { ref } from "vue";
import EmptyData from "../common/EmptyData.vue";

const props = defineProps({
  filteredTargets: Array,
  years: Array,
  uniqueGroupsInList: Array,
  listTypeFilter: String,
  listYearFilter: [String, Number],
  listGroupFilter: String,
  loading: Boolean,
});

const emit = defineEmits([
  "update:listTypeFilter",
  "update:listYearFilter",
  "update:listGroupFilter",
  "delete",
]);

const onDelete = (target) => {
  emit("delete", target);
};
</script>

<template>
  <div class="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
      <div class="mb-4">
        <h2 class="text-xs font-black text-gray-700 uppercase tracking-widest">Danh sách ghi nhận</h2>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1 p-0.5 bg-gray-200/50 rounded-lg">
          <button
            @click="emit('update:listTypeFilter', 'Doanh thu')"
            :class="listTypeFilter === 'Doanh thu' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'"
            class="px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all"
          >
            Doanh thu
          </button>
          <button
            @click="emit('update:listTypeFilter', 'Thuê Bao')"
            :class="listTypeFilter === 'Thuê Bao' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'"
            class="px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all"
          >
            Thuê bao
          </button>
        </div>

        <div class="flex items-center space-x-2">
          <select
            :value="listYearFilter"
            @change="emit('update:listYearFilter', $event.target.value)"
            class="compact-filter-select"
          >
            <option value="all">Tất cả Năm</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <select
            :value="listGroupFilter"
            @change="emit('update:listGroupFilter', $event.target.value)"
            class="compact-filter-select max-w-[130px]"
          >
            <option value="all">Tất cả Nhóm</option>
            <option v-for="gp in uniqueGroupsInList" :key="gp" :value="gp">
              {{ (gp === "Internet truyền hình" || gp === "Internet Truyền hình") ? "Internet" : gp }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-50/60 text-gray-400 text-[9px] font-black uppercase tracking-[0.12em]">
            <th class="px-6 py-4 border-b border-gray-50">Kênh</th>
            <th class="px-6 py-4 border-b border-gray-50">Kỳ hạn</th>
            <th class="px-6 py-4 border-b border-gray-50">Nhóm hàng</th>
            <th class="px-6 py-4 border-b border-gray-50 text-right">Mục tiêu</th>
            <th class="px-6 py-4 border-b border-gray-50 w-10"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="loading">
            <td colspan="5" class="px-6 py-10 text-center text-gray-400 text-xs font-bold animate-pulse">Đang nạp dữ liệu...</td>
          </tr>
          <tr v-else-if="filteredTargets.length === 0">
            <td colspan="5">
              <EmptyData title="Danh sách trống" message="Không có dữ liệu chỉ tiêu nào phù hợp với bộ lọc hiện tại." />
            </td>
          </tr>
          <tr
            v-for="t in filteredTargets"
            :key="`${t.tr_year}-${t.tr_month}-${t.source_type}-${t.product_group}-${t.type}`"
            class="group hover:bg-blue-50/30 transition-all border-l-4 border-transparent hover:border-blue-500"
          >
            <td class="px-6 py-4">
              <span
                :class="t.source_type === 'am' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'"
                class="px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm border border-black/5"
              >
                {{ t.source_type }}
              </span>
            </td>
            <td class="px-6 py-4 text-xs font-bold text-gray-500 tabular-nums">{{ t.tr_month }}/{{ t.tr_year }}</td>
            <td class="px-6 py-4 text-xs font-black text-gray-700">
              {{ (t.product_group === "Internet truyền hình" || t.product_group === "Internet Truyền hình") ? "Internet" : t.product_group }}
            </td>
            <td class="px-6 py-4 text-right text-sm font-black text-gray-900 tabular-nums">
              {{ t.amount.toLocaleString("vi-VN") }}
              <span class="text-[9px] text-gray-400 font-normal ml-0.5 uppercase tracking-tighter">
                {{ t.type === "Doanh thu" ? "VNĐ" : "tb" }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                @click="onDelete(t)"
                class="p-1.5 text-gray-300 hover:text-red-500 transition-all rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.compact-filter-select {
  @apply px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[10px] font-black text-gray-600 outline-none focus:border-blue-400 appearance-none cursor-pointer pr-7;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/xml' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1em 1em;
}
</style>
