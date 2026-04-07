<script setup>
import { onMounted } from "vue";
import { useSmeDashboard } from "../composables/useSmeDashboard";
import SmeKpiCard from "../components/dashboard/SmeKpiCard.vue";
import SmeDonutGauge from "../components/dashboard/SmeDonutGauge.vue";

const {
  loading, selectedDate, comparisons, fetchKpis,
  revenueKpis, subscriberKpis, calcPercent
} = useSmeDashboard();

onMounted(fetchKpis);
</script>

<template>
  <div class="min-h-screen p-4 sm:p-6 lg:p-10 font-sans antialiased relative overflow-hidden bg-[#f4f7fe]">
    <!-- Abstract Background -->
    <div class="fixed top-0 left-[-10%] w-[500px] h-[500px] bg-[#ee0033]/5 rounded-full blur-[100px] pointer-events-none -z-10 anima-blob"></div>
    <div class="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-blob animation-delay-2000"></div>

    <div class="max-w-[1360px] mx-auto">
      <!-- LOADING STATE -->
      <div v-if="loading" class="flex flex-col items-center justify-center h-[60vh] z-50 relative gap-3">
        <div class="w-16 h-16 border-4 border-[#ee0033]/20 border-t-[#ee0033] rounded-full animate-spin"></div>
        <span class="text-[11px] font-black tracking-widest text-[#ee0033] uppercase animate-pulse">Đang đồng bộ</span>
      </div>

      <template v-else>
        <!-- HEADER -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 relative z-10">
          <div>
            <div class="inline-block px-3 py-1 bg-gradient-to-r from-[#ee0033]/10 to-rose-200/20 text-[#ee0033] rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 border border-[#ee0033]/10 shadow-sm">
              Kinh doanh Doanh nghiệp
            </div>
            <h1 class="text-3xl lg:text-[40px] font-black text-[#1b254b] tracking-tight leading-none mb-2 drop-shadow-sm">Thống Kê Doanh Thu</h1>
            <p class="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest">Báo cáo tiến độ KPI kênh Đại lý và kênh AM</p>
          </div>

          <div class="flex items-center gap-3 bg-white/50 backdrop-blur-xl px-3 py-2.5 rounded-2xl border border-white shadow-lg">
            <div class="flex items-center gap-2 pr-4 pl-1 border-r border-slate-200/70">
              <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-[11px] font-black text-slate-500 uppercase tracking-widest">Chọn ngày</span>
            </div>
            <input type="date" v-model="selectedDate" class="text-sm font-black text-[#1b254b] bg-transparent border-none focus:ring-0 outline-none w-[130px]" />
            <button @click="fetchKpis" class="bg-[#1b254b] hover:shadow-lg text-white p-2 rounded-xl transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
          </div>
        </div>

        <!-- ROW 1: DOANH THU -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative z-10 items-stretch">
          <div class="lg:col-span-5 flex flex-col gap-6">
            <SmeDonutGauge 
              title="Tỷ trọng Đóng góp (%)"
              label1="Đại lý" :value1="revenueKpis[0].actual"
              label2="Kênh AM" :value2="revenueKpis[2].actual"
              unit="Triệu đồng"
            />
            
            <div v-if="comparisons.yesterday > 0" class="flex justify-between items-center bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-sm h-[84px]">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-indigo-400 border border-slate-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span class="text-[12px] font-black text-slate-500 uppercase tracking-widest">Thực hiện ngày</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-base font-black text-emerald-500 mr-2">
                   {{ (Math.abs(comparisons.today - comparisons.yesterday) / 1000000).toLocaleString("en-US", { maximumFractionDigits: 1 }) }}
                   <span class="text-[11px] font-bold opacity-60 uppercase">Tr.đ</span>
                </span>
                <span class="flex items-center gap-1 text-[11px] font-black px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  ▲ {{ ((Math.abs(comparisons.today - comparisons.yesterday) / comparisons.yesterday) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 flex flex-col gap-6 w-full">
            <SmeKpiCard 
              v-for="(kpi, idx) in [revenueKpis[0], revenueKpis[2]]" :key="idx"
              :title="kpi.title" :actual="kpi.actual" :target="kpi.target" :unit="kpi.unit"
              :color="idx === 0 ? 'navy' : 'red'"
            >
              <template #icon>
                <svg v-if="idx===0" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <svg v-else class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </template>
            </SmeKpiCard>
          </div>
        </div>

        <!-- TENDO REVENUE SECTION -->
        <div class="mb-10 relative z-10 transition-transform duration-500 hover:-translate-y-1">
          <div class="bg-gradient-to-br from-[#111c44] to-[#0f172a] rounded-[2.5rem] p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
            <div class="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div class="w-[88px] h-[88px] rounded-[1.8rem] flex flex-shrink-0 items-center justify-center relative shadow-lg bg-emerald-500 text-white">
                <div class="absolute inset-0 rounded-[1.8rem] opacity-40 blur-xl bg-emerald-400"></div>
                <svg class="w-10 h-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div class="text-center md:text-left space-y-1">
                <span class="text-[12px] font-black text-emerald-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/10 mb-1 inline-block">Dịch vụ Tendoo</span>
                <div class="flex items-baseline gap-2 pt-2">
                  <h4 class="text-[48px] font-black text-white tracking-tighter leading-none">{{ revenueKpis[1].actual.toLocaleString() }}</h4>
                  <span class="text-[13px] font-black text-slate-400 uppercase tracking-widest">Tr.đ</span>
                </div>
              </div>
            </div>
            <div class="w-full lg:w-[450px] space-y-5 bg-white/5 p-6 rounded-[2rem] border border-white/5 relative z-10">
              <div class="flex justify-between items-end mb-2">
                <span class="text-[12px] font-black text-slate-400 uppercase tracking-widest">Tiến độ hoàn thành</span>
                <span class="text-[32px] font-black leading-none text-emerald-400 drop-shadow-sm">{{ calcPercent(revenueKpis[1].actual, revenueKpis[1].target) }}%</span>
              </div>
              <div class="relative h-[18px] bg-slate-800 rounded-full overflow-hidden shadow-inner w-full border border-slate-700">
                <div class="absolute inset-y-0 left-0 rounded-full z-10 bg-emerald-500" :style="{ width: Math.min(calcPercent(revenueKpis[1].actual, revenueKpis[1].target), 100) + '%' }"></div>
              </div>
              <div class="flex justify-between items-center text-[12px] font-black uppercase tracking-widest pt-2">
                <span class="text-slate-400">Mục tiêu: {{ revenueKpis[1].target.toLocaleString() }}</span>
                <span :class="calcPercent(revenueKpis[1].actual, revenueKpis[1].target) >= 100 ? 'text-emerald-400' : 'text-slate-500'">
                    {{ calcPercent(revenueKpis[1].actual, revenueKpis[1].target) >= 100 ? 'Hoàn thành' : 'Còn ' + Math.max(revenueKpis[1].target - revenueKpis[1].actual, 0).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 2: THUÊ BAO -->
         <div class="space-y-8 relative z-10">
            <h2 class="text-2xl font-black text-[#1b254b] flex items-center gap-3 px-2">
                <div class="w-1.5 h-8 bg-[#ee0033] rounded-full"></div>
                Chỉ Số Phát Triển Thuê Bao
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- GIA HAN -->
                <div class="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gia hạn Duy trì</span>
                            <h4 class="text-xl font-black text-[#1b254b]">{{ subscriberKpis.giaHan.title }}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2 mb-4">
                        <span class="text-3xl font-black text-[#1b254b]">{{ subscriberKpis.giaHan.actual.toLocaleString() }}</span>
                        <span class="text-[10px] font-black text-slate-400 uppercase">Thuê bao</span>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                            <span>Tiến độ: {{ calcPercent(subscriberKpis.giaHan.actual, subscriberKpis.giaHan.target) }}%</span>
                            <span>MT: {{ subscriberKpis.giaHan.target.toLocaleString() }}</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-500" :style="{ width: Math.min(calcPercent(subscriberKpis.giaHan.actual, subscriberKpis.giaHan.target), 100) + '%' }"></div>
                        </div>
                    </div>
                </div>

                <!-- OTHER SUBS -->
                <div v-for="sub in subscriberKpis.details" :key="sub.title" class="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white">
                     <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dịch vụ SME</span>
                            <h4 class="text-xl font-black text-[#1b254b]">{{ sub.title }}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2 mb-4">
                        <span class="text-3xl font-black text-[#1b254b]">{{ sub.actual.toLocaleString() }}</span>
                        <span class="text-[10px] font-black text-slate-400 uppercase">Thuê bao</span>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                            <span>Tiến độ: {{ calcPercent(sub.actual, sub.target) }}%</span>
                            <span>MT: {{ sub.target.toLocaleString() }}</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-orange-500" :style="{ width: Math.min(calcPercent(sub.actual, sub.target), 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TECH FOCUS -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
               <div v-for="sub in subscriberKpis.techFocus" :key="sub.title" class="px-6 py-4 bg-white/40 rounded-2xl border border-white/50 flex items-center justify-between">
                    <div>
                        <h5 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">{{ sub.title }}</h5>
                        <p class="text-[10px] font-bold text-slate-400">Tiến độ: {{ calcPercent(sub.actual, sub.target) }}%</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-black text-[#1b254b]">{{ sub.actual.toLocaleString() }}</div>
                        <div class="text-[9px] font-black text-slate-300 uppercase">Hợp đồng</div>
                    </div>
               </div>
            </div>
         </div>
      </template>
    </div>
  </div>
</template>
