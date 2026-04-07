<script setup>
defineProps({
  title: String,
  actual: Number,
  target: Number,
  unit: String,
  icon: String,
  color: String, // 'navy' or 'red'
});

const calcPercent = (actual, target) => {
  if (!target) return 0;
  return ((actual / target) * 100).toFixed(1);
};
</script>

<template>
  <div
    class="flex-1 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-white w-full relative"
  >
    <div
      class="w-[88px] h-[88px] rounded-[1.8rem] flex-shrink-0 flex items-center justify-center relative shadow-xl"
      :class="color === 'navy' ? 'bg-[#1b254b] text-white' : 'bg-[#ee0033] text-white'"
    >
      <div
        class="absolute inset-0 rounded-[1.8rem] opacity-30 blur-2xl transition-all duration-700"
        :class="color === 'navy' ? 'bg-[#1b254b]' : 'bg-[#ee0033]'"
      ></div>
      <slot name="icon"></slot>
    </div>

    <div class="flex-1 w-full text-center md:text-left pt-2">
      <span class="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.25em] mb-2 block">{{ title }}</span>
      <div class="flex items-baseline justify-center md:justify-start gap-1.5 pt-1">
        <span class="text-[44px] lg:text-[48px] font-[900] text-[#1b254b] tracking-tighter leading-none">
          {{ actual.toLocaleString() }}
        </span>
        <span class="text-[12px] font-[900] text-slate-400 uppercase">{{ unit }}</span>
      </div>
    </div>

    <div class="w-full md:w-[320px] lg:w-[350px] space-y-4 px-2">
      <div class="flex justify-between items-end mb-2">
        <span class="text-[11px] font-[900] text-slate-500 uppercase tracking-widest">Tiến độ kế hoạch</span>
        <span class="text-[28px] font-[900] leading-none" :class="color === 'navy' ? 'text-[#1b254b]' : 'text-[#ee0033]'">
          {{ calcPercent(actual, target) }}%
        </span>
      </div>
      <div class="relative h-[18px] bg-slate-200/80 rounded-full overflow-hidden shadow-inner w-full border border-slate-200">
        <div
          class="absolute inset-y-0 left-0 rounded-full z-10"
          :class="color === 'navy' ? 'bg-[#1b254b]' : 'bg-[#ee0033]'"
          :style="{ width: Math.min(calcPercent(actual, target), 100) + '%' }"
        ></div>
      </div>
      <div class="flex justify-between items-center text-[11px] font-[900] uppercase tracking-widest pt-2 text-slate-500">
        <span>MT: {{ target.toLocaleString() }}</span>
        <span class="text-slate-400">Còn {{ Math.max(target - actual, 0).toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>
