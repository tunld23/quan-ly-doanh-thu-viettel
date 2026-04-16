<script setup>
defineProps({
  label1: String,
  value1: Number,
  target1: { type: Number, default: 0 },
  label2: String,
  value2: Number,
  target2: { type: Number, default: 0 },
  title: String,
  unit: String,
  comparisons: {
    type: Object,
    default: () => ({ today: 0, yesterday: 0, lastMonth: 0, lastYear: 0 }),
  },
});

const getGaugeOffset = (percent) => {
  const length = 251.2;
  return length * (1 - Math.min(percent, 100) / 100);
};

const calcPercent = (v, total) => {
  if (!total) return 0;
  return ((v / total) * 100).toFixed(1);
};
</script>

<template>
  <div
    class="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-white relative flex flex-col items-center flex-1 h-full"
  >
    <h3
      class="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.2em] mb-4 text-center bg-slate-50 border border-slate-100/80 px-6 py-2.5 rounded-2xl w-[90%]"
    >
      {{ title }}
    </h3>

    <div class="flex flex-col justify-center flex-1 w-full">
      <div class="relative w-[180px] h-[180px] mx-auto mb-8">
        <div
          class="absolute inset-4 rounded-full shadow-[0_0_40px_rgba(238,0,51,0.1)] mix-blend-multiply pointer-events-none"
        ></div>
        <svg
          viewBox="0 0 100 100"
          class="w-full h-full transform -rotate-90 relative z-10"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            class="stroke-slate-100"
            stroke-width="10"
          />
          <!-- Track 1 (label2) - Red -->
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            class="stroke-[#ee0033]"
            stroke-width="10"
            stroke-dasharray="251.2"
            :stroke-dashoffset="
              getGaugeOffset(calcPercent(value2, value1 + value2))
            "
            :transform="`rotate(${(value1 / (value1 + value2 || 1)) * 360} 50 50)`"
            stroke-linecap="round"
          />
          <!-- Track 2 (label1) - Dark -->
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            class="stroke-[#1b254b]"
            stroke-width="10"
            stroke-dasharray="251.2"
            :stroke-dashoffset="
              getGaugeOffset(calcPercent(value1, value1 + value2))
            "
            stroke-linecap="round"
          />
        </svg>

        <div
          class="absolute inset-0 flex flex-col items-center justify-center z-20 text-center"
        >
          <h4
            class="text-[32px] font-[900] text-[#1b254b] leading-tight tracking-tighter mt-1"
          >
            {{ (value1 + value2).toLocaleString() }}
          </h4>
          <p
            class="text-[8px] font-[900] text-[#ee0033] uppercase tracking-[0.15em] bg-red-50 px-3 py-1 rounded-full mt-1 border border-red-100/50"
          >
            {{ unit }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-center gap-10 w-full mb-6">
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 bg-[#1b254b] rounded-full shadow-lg"></div>
            <span class="text-[20px] font-[900] text-[#1b254b] leading-none"
              >{{ calcPercent(value1, value1 + value2) }}%</span
            >
          </div>
          <span
            class="text-[9px] font-[900] text-slate-400 uppercase tracking-widest"
            >{{ label1 }}</span
          >
        </div>
        <div
          class="flex items-center justify-center h-10 w-px bg-slate-200"
        ></div>
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 bg-[#ee0033] rounded-full shadow-lg"></div>
            <span class="text-[20px] font-[900] text-[#ee0033] leading-none"
              >{{ calcPercent(value2, value1 + value2) }}%</span
            >
          </div>
          <span
            class="text-[9px] font-[900] text-slate-400 uppercase tracking-widest"
            >{{ label2 }}</span
          >
        </div>
      </div>

      <!-- TINY COMBINED PROGRESS -->
      <div v-if="target1 + target2 > 0" class="w-full px-2 mb-4">
        <div
          class="flex items-center justify-between gap-3 mb-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
        >
          <div class="flex items-center gap-2">
            <svg
              class="w-3 h-3 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span
              class="text-[10px] font-black text-slate-500 uppercase tracking-widest"
              >Tiến độ KH tổng:</span
            >
          </div>
          <span class="text-[14px] font-black text-[#1b254b] leading-none"
            >{{ calcPercent(value1 + value2, target1 + target2) }}%</span
          >
        </div>
        <div
          class="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 mb-1.5"
        >
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-[#ee0033] rounded-full transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1)"
            :style="{
              width:
                Math.min(calcPercent(value1 + value2, target1 + target2), 100) +
                '%',
            }"
          ></div>
        </div>
        <div
          class="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400"
        >
          <span>KH: {{ (target1 + target2).toLocaleString() }}</span>
          <span
            >TH:
            {{
              (value1 + value2).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })
            }}</span
          >
        </div>
      </div>

      <!-- MERGED COMPARISONS -->
      <div class="pt-6 border-t border-slate-100 space-y-1">
        <template
          v-for="(comp, idx) in [
            {
              label: 'Ngày với ngày n-1',
              current: comparisons.today,
              prev: comparisons.yesterday,
              icon: 'clock',
            },
            {
              label: 'Cùng kỳ tháng n-1',
              current: comparisons.todayMtd,
              prev: comparisons.lastMonth,
              icon: 'calendar',
            },
            {
              label: 'Cùng kỳ năm n-1',
              current: comparisons.todayMtd,
              prev: comparisons.lastYear,
              icon: 'trending-up',
            },
          ]"
          :key="idx"
        >
          <div
            v-if="comp.prev > 0"
            class="flex items-center justify-between gap-4 py-2.5 px-1"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400"
              >
                <svg
                  v-if="comp.icon === 'clock'"
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-if="comp.icon === 'calendar'"
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <svg
                  v-if="comp.icon === 'trending-up'"
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span
                class="text-[10px] font-[900] text-slate-500 uppercase tracking-wide"
                >{{ comp.label }}</span
              >
            </div>

            <div class="flex items-center gap-3">
              <span class="text-[12px] font-[900] text-slate-700">
                {{
                  (comp.prev / 1000000).toLocaleString("en-US", {
                    maximumFractionDigits: 1,
                  })
                }}
                <span class="text-[8px] opacity-40">Tr.đ</span>
              </span>
              <div
                class="flex items-center gap-0.5 text-[9px] font-[900] px-1.5 py-0.5 rounded border"
                :class="
                  comp.current >= comp.prev
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                "
              >
                {{ comp.current >= comp.prev ? "▲" : "▼" }}
                {{
                  (
                    (Math.abs(comp.current - comp.prev) / comp.prev) *
                    100
                  ).toFixed(1)
                }}%
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
