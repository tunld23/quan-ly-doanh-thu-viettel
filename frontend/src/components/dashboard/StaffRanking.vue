<template>
  <div class="h-full">
    <h3 class="text-[16px] text-gray-800 mb-8 font-semibold">
      Xếp hạng nhân viên
    </h3>
    <div class="space-y-5">
      <div
        v-for="(staff, index) in rankings"
        :key="staff.name"
        class="group flex items-center gap-4 animate-in slide-in-from-right duration-500"
        :style="{ transitionDelay: `${index * 50}ms` }"
      >
        <div class="flex-shrink-0 relative">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm"
            :class="[
              index === 0 ? 'bg-amber-100 text-amber-700' : 
              index === 1 ? 'bg-slate-100 text-slate-700' : 
              index === 2 ? 'bg-orange-100 text-orange-700' : 
              'bg-gray-50 text-gray-500',
            ]"
          >
            {{ index + 1 }}
          </div>
          <!-- Rank Change Badge -->
          <div v-if="isComparisonMode && staff.rankChange !== '-'" class="absolute -top-1.5 -right-1.5 flex items-center justify-center">
            <template v-if="staff.rankChange === 'new'">
              <span class="bg-blue-500 text-white text-[8px] px-1 rounded-full font-black uppercase shadow-sm border border-white">New</span>
            </template>
            <template v-else-if="staff.rankChange.startsWith('up')">
              <span class="bg-emerald-500 text-white p-0.5 rounded-full shadow-sm flex items-center gap-0.5 px-1 min-w-[18px] h-[18px] border border-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                <span class="text-[9px] font-black leading-none">{{ staff.rankChange.split(':')[1] }}</span>
              </span>
            </template>
            <template v-else-if="staff.rankChange.startsWith('down')">
               <span class="bg-red-500 text-white p-0.5 rounded-full shadow-sm flex items-center gap-0.5 px-1 min-w-[18px] h-[18px] border border-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 011.414-1.414L9 14.586V3a1 1 0 112 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                <span class="text-[9px] font-black leading-none">{{ staff.rankChange.split(':')[1] }}</span>
              </span>
            </template>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-end mb-1.5">
            <span
              class="text-sm font-bold text-gray-700 truncate group-hover:text-blue-600 transition-colors"
            >
              {{ staff.name }}
            </span>
            <span class="text-[13px] font-bold text-gray-900 ml-2">
              {{ staff.value.toLocaleString("vi-VN") }}
            </span>
          </div>
          <!-- Progress Bar -->
          <div
            class="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-50"
          >
            <div
              class="h-full transition-all duration-1000 ease-out rounded-full shadow-sm"
              :class="[
                index === 0
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : index === 1
                    ? 'bg-gradient-to-r from-slate-400 to-slate-500'
                    : index === 2
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                      : 'bg-gradient-to-r from-blue-400 to-blue-500',
              ]"
              :style="{ width: `${(staff.value / maxVal) * 100 || 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State for Ranking -->
    <div
      v-if="!rankings.length"
      class="flex flex-col items-center justify-center py-12 text-gray-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-10 w-10 mb-2 opacity-20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span class="text-xs font-medium">Chưa có xếp hạng</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  rankings: {
    type: Array,
    default: () => [],
  },
  isComparisonMode: {
    type: Boolean,
    default: false
  }
});

const maxVal = computed(() => {
  if (!props.rankings.length) return 1;
  return Math.max(...props.rankings.map((r) => r.value));
});
</script>
