<script setup>
defineProps({
  history: Array
});

const emit = defineEmits(['delete']);

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(Math.abs(val));
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 flex flex-col">
    <h2 class="text-xl font-bold text-gray-700 mb-6 flex items-center">
      <svg class="w-6 h-6 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      Lịch sử gần đây
    </h2>

    <div class="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2 custom-scroll">
      <div v-for="adj in history" :key="adj.created_at" class="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
        <button @click="emit('delete', adj.created_at)" class="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
        
        <div class="flex justify-between items-start mb-1">
          <span class="text-[10px] font-bold text-gray-500">Tháng {{ adj.tr_month }}/{{ adj.tr_year }}</span>
          <span class="text-[10px] text-gray-400">{{ formatDate(adj.created_at) }}</span>
        </div>
        <div class="flex items-center justify-between mb-1">
          <p class="font-bold text-gray-800 text-sm">{{ adj.nhan_vien }}</p>
          <div class="flex gap-1">
            <span class="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">{{ adj.source_type === 'am' ? 'AM' : 'Đại lý' }}</span>
            <span class="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">{{ adj.product_group || 'Chung' }}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div :class="adj.adj_quantity >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ adj.adj_quantity >= 0 ? '+' : '' }}{{ adj.adj_quantity }} SL
          </div>
          <div class="font-bold" :class="adj.adj_amount >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ adj.adj_amount >= 0 ? '+' : '' }}{{ formatCurrency(adj.adj_amount) }}đ
          </div>
        </div>
        <p v-if="adj.note" class="mt-2 text-[11px] italic text-gray-500 bg-white p-2 rounded">"{{ adj.note }}"</p>
      </div>

      <div v-if="history.length === 0" class="text-center py-10 text-gray-400 text-sm italic">
        Chưa có dữ liệu.
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
