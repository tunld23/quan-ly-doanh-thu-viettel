<script setup>
import { computed } from "vue";
import { getShortName } from "../../utils/chartConfig";

const props = defineProps({
  dataType: String,
  isComparisonMode: Boolean,
  categoryData: Object,
  comparisonData: Object,
  viewMode: String,
  activeMetric: String,
  calculateMonthTotal: Function,
  calculateMonthTotalAcrossYears: Function,
  calculateCategoryTotal: Function,
  calculateGrandTotal: Function,
  calculateYearTotal: Function,
  calculateGrandTotalAcrossYears: Function,
  formatValue: Function,
});
</script>

<template>
  <div class="overflow-x-auto rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 max-h-[600px] custom-scrollbar">
    <table class="w-full text-left border-separate border-spacing-0">
      <thead class="sticky top-0 z-20">
        <tr class="bg-gray-50/90 backdrop-blur-md">
          <template v-if="!isComparisonMode && dataType === 'all'">
            <th class="p-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 sticky left-0 bg-gray-50 z-30">Tháng</th>
            <th v-for="cat in categoryData?.categories || []" :key="cat" class="p-4 text-[10px] font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 text-right min-w-[100px] truncate" :title="cat">
              {{ getShortName(cat) }}
            </th>
            <th class="p-4 text-[11px] font-black text-blue-700 uppercase tracking-widest border-b border-gray-200 text-right bg-blue-100 sticky right-0 z-30 shadow-[-6px_0_12px_rgba(43,84,255,0.15)] min-w-[120px]">
              {{ viewMode === "subscriber" ? "Tổng TB" : "Tổng tháng" }}
            </th>
          </template>
          <template v-else>
            <th class="p-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 sticky left-0 bg-gray-50 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.05)]">Tháng</th>
            <th v-for="year in comparisonData?.years || []" :key="year" class="p-4 text-right text-[11px] font-black text-gray-700 uppercase tracking-widest border-b border-gray-100 text-right min-w-[120px]">Năm {{ year }}</th>
            <th class="p-4 text-[11px] font-black text-blue-700 uppercase tracking-widest border-b border-gray-200 text-right bg-blue-100 sticky right-0 z-30 shadow-[-6px_0_12px_rgba(43,84,255,0.15)] min-w-[140px]">Tổng tháng</th>
          </template>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50 bg-white">
        <template v-if="!isComparisonMode && dataType === 'all'">
          <tr v-for="(month, idx) in categoryData?.months || []" :key="month" class="hover:bg-blue-50/10 transition-all group">
            <td class="p-4 text-[13px] font-black text-gray-600 border-r border-gray-100 sticky left-0 bg-white z-10">{{ month }}</td>
            <td v-for="catSeries in categoryData?.series || []" :key="catSeries.name" class="p-4 text-[13px] font-bold text-gray-700 text-right font-mono tracking-tight max-w-[140px] truncate" :title="formatValue(catSeries.data[idx])">
              {{ formatValue(catSeries.data[idx]) }}
            </td>
            <td class="p-4 text-[13px] font-black text-blue-800 text-right bg-blue-50 sticky right-0 z-10 font-mono shadow-[-6px_0_12px_rgba(43,84,255,0.08)] group-hover:bg-blue-100 max-w-[150px] truncate" :title="formatValue(calculateMonthTotal(idx))">
              {{ formatValue(calculateMonthTotal(idx)) }}
            </td>
          </tr>
        </template>
        <template v-else>
          <tr v-for="(label, lIdx) in comparisonData?.labels || []" :key="lIdx" class="hover:bg-blue-50/10 transition-all group">
            <td class="p-4 text-[13px] font-black text-slate-800 border-r border-gray-100 sticky left-0 bg-white z-10 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">{{ label }}</td>
            <td v-for="year in comparisonData?.years || []" :key="year" class="p-4 text-[13px] font-bold text-gray-600 text-right font-mono tracking-tight max-w-[140px] truncate" :title="formatValue(comparisonData?.yearData[year][lIdx])">
              {{ formatValue(comparisonData?.yearData[year][lIdx]) }}
            </td>
            <td class="p-4 text-[14px] font-black text-blue-800 text-right bg-white sticky right-0 z-10 font-mono shadow-[-6px_0_12px_rgba(43,84,255,0.12)] group-hover:bg-blue-50 max-w-[150px] truncate" :title="formatValue(calculateMonthTotalAcrossYears(lIdx))">
              {{ formatValue(calculateMonthTotalAcrossYears(lIdx)) }}
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot class="sticky bottom-0 z-20">
        <tr class="bg-slate-900 text-white shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <template v-if="dataType === 'all' && !isComparisonMode">
            <td class="p-3 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-slate-800 rounded-bl-3xl">TỔNG NĂM</td>
            <td v-for="catSeries in categoryData?.series || []" :key="catSeries.name" class="p-3 text-[12px] text-right font-mono font-black text-blue-300 max-w-[110px] truncate" :title="getShortName(catSeries.name)">
              {{ formatValue(calculateCategoryTotal(catSeries.data)) }}
            </td>
            <td class="p-4 text-[14px] text-right bg-blue-600 font-mono font-black text-white sticky right-0 z-10 shadow-[-4px_0_12px_rgba(43,84,255,0.2)] rounded-br-3xl">
              {{ formatValue(calculateGrandTotal()) }}
            </td>
          </template>
          <template v-else>
            <td class="p-3 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-slate-800 rounded-bl-3xl">TỔNG NĂM</td>
            <td v-for="year in comparisonData?.years || []" :key="year" class="p-3 text-[12px] text-right font-mono font-black text-blue-300 min-w-[120px]">
              {{ formatValue(calculateYearTotal(year)) }}
            </td>
            <td class="p-3 text-[13px] text-right bg-blue-600 font-mono font-black text-white sticky right-0 z-10 shadow-[-4px_0_12px_rgba(43,84,255,0.2)] rounded-br-3xl">
              {{ formatValue(calculateGrandTotalAcrossYears()) }}
            </td>
          </template>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
