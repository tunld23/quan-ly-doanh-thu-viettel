<script setup>
import { onMounted, computed } from "vue";
import { useSmeDashboard } from "../composables/useSmeDashboard";
import SmeKpiCard from "../components/dashboard/SmeKpiCard.vue";
import SmeDonutGauge from "../components/dashboard/SmeDonutGauge.vue";

const {
  loading,
  selectedDate,
  comparisons,
  fetchKpis,
  revenueKpis,
  subscriberKpis,
  calcPercent,
} = useSmeDashboard();

const unifiedSubscriberKpis = computed(() => {
  const sk = subscriberKpis.value;
  const all = [
    {
      ...sk.giaHan,
      title: sk.giaHan.title || "Gia hạn Duy trì",
      type: "Gia hạn",
      color: "indigo",
      icon: "refresh",
    },
    { ...sk.details[0], type: "Dịch vụ SME", color: "orange", icon: "bolt" },
    { ...sk.details[1], type: "Dịch vụ SME", color: "rose", icon: "chip" },
    {
      ...sk.techFocus[0],
      type: "Công nghệ",
      color: "emerald",
      icon: "sparkles",
    },
    { ...sk.techFocus[1], type: "Công nghệ", color: "cyan", icon: "globe" },
    { ...sk.techFocus[2], type: "Công nghệ", color: "violet", icon: "new" },
  ];
  return all.filter((kpi) => kpi.target > 0);
});

const totalRevenueKpi = computed(() => {
  const dealer = revenueKpis.value[0];
  const am = revenueKpis.value[2];
  const actual = (dealer?.actual || 0) + (am?.actual || 0);
  const target = (dealer?.target || 0) + (am?.target || 0);
  const percent = target > 0 ? (actual / target) * 100 : 0;
  return { actual, target, percent };
});

const isAnyTargetEntered = computed(() => {
  return (
    revenueKpis.value.some((k) => k.target > 0) ||
    unifiedSubscriberKpis.value.length > 0
  );
});

onMounted(fetchKpis);
</script>

<template>
  <div
    class="min-h-screen p-4 sm:p-6 lg:p-10 font-sans antialiased relative overflow-hidden bg-[#f4f7fe]"
  >
    <!-- Abstract Background -->
    <div
      class="fixed top-0 left-[-10%] w-[500px] h-[500px] bg-[#ee0033]/5 rounded-full blur-[100px] pointer-events-none -z-10 anima-blob"
    ></div>
    <div
      class="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-blob animation-delay-2000"
    ></div>

    <div class="max-w-[1360px] mx-auto">
      <!-- LOADING STATE -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center h-[60vh] z-50 relative gap-3"
      >
        <div
          class="w-16 h-16 border-4 border-[#ee0033]/20 border-t-[#ee0033] rounded-full animate-spin"
        ></div>
        <span
          class="text-[11px] font-black tracking-widest text-[#ee0033] uppercase animate-pulse"
          >Đang đồng bộ</span
        >
      </div>

      <template v-else>
        <!-- HEADER -->
        <div
          class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 relative z-10"
        >
          <div>
            <div
              class="inline-block px-3 py-1 bg-gradient-to-r from-[#ee0033]/10 to-rose-200/20 text-[#ee0033] rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 border border-[#ee0033]/10 shadow-sm"
            >
              Kinh doanh Doanh nghiệp
            </div>
            <h1
              class="text-3xl lg:text-[40px] font-black text-[#1b254b] tracking-tight leading-none mb-2 drop-shadow-sm"
            >
              Thống Kê Doanh Thu
            </h1>
            <p
              class="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest"
            >
              Báo cáo tiến độ KPI kênh Đại lý và kênh AM
            </p>
          </div>

          <div
            class="flex items-center gap-3 bg-white/50 backdrop-blur-xl px-3 py-2.5 rounded-2xl border border-white shadow-lg"
          >
            <div
              class="flex items-center gap-2 pr-4 pl-1 border-r border-slate-200/70"
            >
              <svg
                class="w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span
                class="text-[11px] font-black text-slate-500 uppercase tracking-widest"
                >Chọn ngày</span
              >
            </div>
            <input
              type="date"
              v-model="selectedDate"
              class="text-sm font-black text-[#1b254b] bg-transparent border-none focus:ring-0 outline-none w-[130px]"
            />
            <button
              @click="fetchKpis"
              class="bg-[#1b254b] hover:shadow-lg text-white p-2 rounded-xl transition-all"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- NEW: EMPTY STATE IF NO TARGETS -->
        <div
          v-if="!isAnyTargetEntered"
          class="mt-20 flex flex-col items-center justify-center py-24 px-10 bg-white/40 backdrop-blur-xl rounded-[3.5rem] border border-white shadow-sm transition-all duration-700 relative z-10 overflow-hidden"
        >
          <!-- Decorative Blobs -->
          <div
            class="absolute -top-24 -left-24 w-64 h-64 bg-slate-100/50 rounded-full blur-3xl -z-10"
          ></div>
          <div
            class="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10"
          ></div>

          <div
            class="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl border border-slate-50 text-slate-200"
          >
            <svg
              class="w-14 h-14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-slate-800 tracking-tight mb-4">
            Chưa có chỉ tiêu thực hiện
          </h3>
          <p
            class="text-slate-500 text-[13px] font-bold text-center max-w-sm leading-relaxed uppercase tracking-widest opacity-80 mb-10"
          >
            Hệ thống đang chờ dữ liệu mục tiêu của tháng
            {{ new Date(selectedDate).getMonth() + 1 }}/{{
              new Date(selectedDate).getFullYear()
            }}<br />
            Vui lòng nạp chỉ tiêu để bắt đầu theo dõi hiệu suất.
          </p>
          <router-link
            to="/targets"
            class="px-10 py-4 bg-[#ee0033] hover:bg-[#d0002d] text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-[#ee0033]/30 flex items-center gap-3 active:scale-95"
          >
            <span>Thiết lập chỉ tiêu</span>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </router-link>
        </div>

        <template v-else>
          <!-- ROW 1: DOANH THU -->
          <div
            class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative z-10 items-stretch"
          >
            <div class="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
              <SmeDonutGauge
                v-if="revenueKpis[0].target > 0 || revenueKpis[2].target > 0"
                title="Tỷ trọng Đóng góp (%)"
                label1="Đại lý"
                :value1="revenueKpis[0].actual"
                :target1="revenueKpis[0].target"
                label2="Kênh AM"
                :value2="revenueKpis[2].actual"
                :target2="revenueKpis[2].target"
                :comparisons="comparisons"
                unit="Triệu đồng"
              />
            </div>

            <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 w-full">
              <template
                v-for="(kpi, idx) in [revenueKpis[0], revenueKpis[2]]"
                :key="idx"
              >
                <SmeKpiCard
                  v-if="kpi.target > 0"
                  :title="kpi.title"
                  :actual="kpi.actual"
                  :target="kpi.target"
                  :unit="kpi.unit"
                  :color="idx === 0 ? 'navy' : 'red'"
                >
                  <template #icon>
                    <svg
                      v-if="idx === 0"
                      class="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </template>
                </SmeKpiCard>
              </template>
            </div>
          </div>

          <!-- TENDO REVENUE SECTION -->
          <div
            v-if="revenueKpis[1].target > 0"
            class="mb-10 relative z-10 transition-transform duration-500 hover:-translate-y-1"
          >
            <div
              class="bg-gradient-to-br from-[#111c44] to-[#0f172a] rounded-[2.5rem] p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden"
            >
              <div
                class="flex flex-col md:flex-row items-center gap-8 relative z-10"
              >
                <div
                  class="w-[88px] h-[88px] rounded-[1.8rem] flex flex-shrink-0 items-center justify-center relative shadow-lg bg-emerald-500 text-white"
                >
                  <div
                    class="absolute inset-0 rounded-[1.8rem] opacity-40 blur-xl bg-emerald-400"
                  ></div>
                  <svg
                    class="w-10 h-10 relative z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div class="text-center md:text-left space-y-1">
                  <span
                    class="text-[12px] font-black text-emerald-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/10 mb-1 inline-block"
                    >Dịch vụ Tendoo</span
                  >
                  <div class="flex items-baseline gap-2 pt-2">
                    <h4
                      class="text-[48px] font-black text-white tracking-tighter leading-none"
                    >
                      {{ revenueKpis[1].actual.toLocaleString() }}
                    </h4>
                    <span
                      class="text-[13px] font-black text-slate-400 uppercase tracking-widest"
                      >Tr.đ</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="w-full lg:w-[450px] space-y-5 bg-white/5 p-6 rounded-[2rem] border border-white/5 relative z-10"
              >
                <div class="flex justify-between items-end mb-2">
                  <span
                    class="text-[12px] font-black text-slate-400 uppercase tracking-widest"
                    >Tiến độ hoàn thành</span
                  >
                  <span
                    class="text-[32px] font-black leading-none text-emerald-400 drop-shadow-sm"
                    >{{
                      calcPercent(revenueKpis[1].actual, revenueKpis[1].target)
                    }}%</span
                  >
                </div>
                <div
                  class="relative h-[18px] bg-slate-800 rounded-full overflow-hidden shadow-inner w-full border border-slate-700"
                >
                  <div
                    class="absolute inset-y-0 left-0 rounded-full z-10 bg-emerald-500"
                    :style="{
                      width:
                        Math.min(
                          calcPercent(
                            revenueKpis[1].actual,
                            revenueKpis[1].target,
                          ),
                          100,
                        ) + '%',
                    }"
                  ></div>
                </div>
                <div
                  class="flex justify-between items-center text-[12px] font-black uppercase tracking-widest pt-2"
                >
                  <span class="text-slate-400"
                    >KH: {{ revenueKpis[1].target.toLocaleString() }}</span
                  >
                  <span
                    :class="
                      calcPercent(
                        revenueKpis[1].actual,
                        revenueKpis[1].target,
                      ) >= 100
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    "
                  >
                    {{
                      calcPercent(
                        revenueKpis[1].actual,
                        revenueKpis[1].target,
                      ) >= 100
                        ? "Hoàn thành"
                        : "Còn " +
                          Math.max(
                            revenueKpis[1].target - revenueKpis[1].actual,
                            0,
                          ).toLocaleString()
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ROW 2: THUÊ BAO -->
          <div
            v-if="unifiedSubscriberKpis.length > 0"
            class="space-y-10 relative z-10"
          >
            <div class="flex items-center justify-between px-2">
              <h2
                class="text-2xl font-black text-[#1b254b] flex items-center gap-3"
              >
                <div
                  class="w-1.5 h-8 bg-[#ee0033] rounded-full shadow-[0_0_10px_rgba(238,0,51,0.3)]"
                ></div>
                Chỉ Số Phát Triển Thuê Bao
              </h2>
              <div
                class="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white text-[11px] font-black text-slate-500 uppercase tracking-widest"
              >
                <span
                  class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                Thời gian thực
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div
                v-for="(sub, idx) in unifiedSubscriberKpis"
                :key="idx"
                class="group relative bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-sm border border-white hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                <!-- Background Accent Blob -->
                <div
                  class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-150"
                  :class="{
                    'bg-indigo-500': sub.color === 'indigo',
                    'bg-orange-500': sub.color === 'orange',
                    'bg-rose-500': sub.color === 'rose',
                    'bg-emerald-500': sub.color === 'emerald',
                    'bg-cyan-500': sub.color === 'cyan',
                    'bg-violet-500': sub.color === 'violet',
                  }"
                ></div>

                <div class="flex flex-col mb-2 relative z-10">
                  <div class="flex justify-between items-start mb-2">
                    <div
                      class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      :class="{
                        'bg-indigo-50 text-indigo-500': sub.color === 'indigo',
                        'bg-orange-50 text-orange-500': sub.color === 'orange',
                        'bg-rose-50 text-rose-500': sub.color === 'rose',
                        'bg-emerald-50 text-emerald-500':
                          sub.color === 'emerald',
                        'bg-cyan-50 text-cyan-500': sub.color === 'cyan',
                        'bg-violet-50 text-violet-500': sub.color === 'violet',
                      }"
                    >
                      <svg
                        v-if="sub.icon === 'refresh'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <svg
                        v-if="sub.icon === 'bolt'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <svg
                        v-if="sub.icon === 'chip'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2-2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                      <svg
                        v-if="sub.icon === 'sparkles'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <svg
                        v-if="sub.icon === 'globe'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <svg
                        v-if="sub.icon === 'new'"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4
                    class="text-xl font-black text-[#1b254b] tracking-tight group-hover:text-[#ee0033] transition-colors duration-300 min-h-[48px] line-clamp-2"
                  >
                    {{ sub.title }}
                  </h4>
                </div>

                <div class="flex items-end justify-between gap-6 relative z-10">
                  <div class="flex flex-col">
                    <span
                      class="text-4xl font-black text-[#1b254b] tracking-tighter leading-none mb-1"
                      >{{ sub.actual.toLocaleString() }}</span
                    >
                    <span
                      class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                      >{{ sub.unit || "Thuê bao" }}</span
                    >
                  </div>

                  <div class="flex-1 space-y-3 pb-1">
                    <div
                      class="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      <span>{{ calcPercent(sub.actual, sub.target) }}%</span>
                      <span>KH: {{ sub.target.toLocaleString() }}</span>
                    </div>
                    <div
                      class="relative h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"
                    >
                      <div
                        class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                        :class="{
                          'bg-indigo-500': sub.color === 'indigo',
                          'bg-orange-500': sub.color === 'orange',
                          'bg-rose-500': sub.color === 'rose',
                          'bg-emerald-500': sub.color === 'emerald',
                          'bg-cyan-500': sub.color === 'cyan',
                          'bg-violet-500': sub.color === 'violet',
                        }"
                        :style="{
                          width:
                            Math.min(calcPercent(sub.actual, sub.target), 100) +
                            '%',
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
