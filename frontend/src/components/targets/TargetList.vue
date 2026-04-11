<script setup>
import { computed } from "vue";
import { PREDEFINED_TARGETS } from "../../composables/useTargets";
import EmptyData from "../common/EmptyData.vue";

const props = defineProps({
  allTargets: Array,
  years: Array,
  listYearFilter: [String, Number],
  listMonthFilter: String,
  loading: Boolean,
});

const emit = defineEmits([
  "update:listYearFilter",
  "update:listMonthFilter",
  "delete",
]);

const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));

const dataForSelectedPeriod = computed(() => {
  const year = parseInt(props.listYearFilter);
  const month = props.listMonthFilter;
  const filtered = (props.allTargets || []).filter(t => 
    parseInt(t.tr_year) === year && t.tr_month === month
  );

  const mapped = PREDEFINED_TARGETS.map(pt => {
    const found = filtered.find(t => 
      t.product_group === pt.dbName && 
      t.type === pt.type
    );
    return {
      ...pt,
      amount: found ? found.amount : null,
      month: month,
      year: year
    };
  });

  return mapped.filter(d => d.amount !== null);
});

const hasData = computed(() => dataForSelectedPeriod.value.some(d => d.amount !== null));

const formatAmount = (val) => {
  if (val === null) return "-";
  return val.toLocaleString("vi-VN");
};

const onDelete = (target) => {
  emit("delete", {
    tr_year: target.year,
    tr_month: target.month,
    product_group: target.dbName,
    type: target.type
  });
};
</script>

<template>
  <div class="mt-10 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
    <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <div class="w-2.5 h-2.5 bg-indigo-500 rounded-lg shadow-sm"></div>
          Báo cáo chỉ tiêu tháng {{ listMonthFilter }}/{{ listYearFilter }}
        </h2>
      </div>

      <div class="flex items-center space-x-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100/50">
        <select
          :value="listMonthFilter"
          @change="emit('update:listMonthFilter', $event.target.value)"
          class="compact-filter-select"
        >
          <option v-for="m in 12" :key="m" :value="String(m).padStart(2, '0')">Tháng {{ m }}</option>
        </select>
        <select
          :value="listYearFilter"
          @change="emit('update:listYearFilter', $event.target.value)"
          class="compact-filter-select"
        >
          <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
        </select>
      </div>
    </div>

    <div class="overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/30 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
            <th class="px-8 py-5">Tên chỉ tiêu chiến lược</th>
            <th class="px-8 py-5 text-right w-48">Giá trị mục tiêu</th>
            <th class="px-4 py-5 w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50/50">
          <tr v-if="loading">
            <td colspan="3" class="px-8 py-20 text-center text-gray-400 text-xs font-bold animate-pulse uppercase tracking-widest">
              Đang đồng bộ dữ liệu...
            </td>
          </tr>
          <tr v-else-if="!hasData">
            <td colspan="3">
              <EmptyData title="Chưa nạp chỉ tiêu" message="Hãy chọn tháng/năm khác hoặc nạp chỉ tiêu mới ở trên." />
            </td>
          </tr>
          <tr
            v-for="row in dataForSelectedPeriod"
            :key="row.id"
            class="group hover:bg-slate-50 transition-all duration-200"
          >
            <td class="px-8 py-5">
              <div class="flex flex-col">
                <span class="text-[13px] font-black text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{{ row.name }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full" :class="row.type === 'Doanh thu' ? 'bg-blue-400' : 'bg-emerald-400'"></span>
                  {{ row.type }}
                </span>
              </div>
            </td>
            <td class="px-8 py-5 text-right">
              <div v-if="row.amount !== null" class="flex flex-col items-end">
                <span class="text-base font-black text-slate-900 tabular-nums">{{ formatAmount(row.amount) }}</span>
                <span class="text-[9px] font-black text-indigo-400/80 uppercase mt-0.5 tracking-tighter">{{ row.unit }}</span>
              </div>
              <span v-else class="text-xs font-bold text-slate-200 uppercase tracking-widest italic">Chưa nhập</span>
            </td>
            <td class="px-4 py-5 text-right">
              <button 
                v-if="row.amount !== null"
                @click="onDelete(row)"
                class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Xóa chỉ tiêu này"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  @apply px-4 py-2 rounded-xl border-none bg-slate-50 text-[11px] font-black text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer pr-9 transition-all;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.1em 1.1em;
}
</style>
