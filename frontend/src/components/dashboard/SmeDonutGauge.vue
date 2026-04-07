<script setup>
defineProps({
  label1: String,
  value1: Number,
  label2: String,
  value2: Number,
  title: String,
  unit: String,
});

const getGaugeOffset = (percent) => {
  const length = 251.2;
  return length * (1 - Math.min(percent, 100) / 100);
};

const calcPercent = (v, total) => {
    if (!total) return 0;
    return ((v / total) * 100).toFixed(1);
}
</script>

<template>
  <div class="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-white relative flex flex-col items-center flex-1 min-h-[420px]">
    <h3 class="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.2em] mb-4 text-center bg-slate-50 border border-slate-100/80 px-6 py-2.5 rounded-2xl w-[90%]">
      {{ title }}
    </h3>

    <div class="flex flex-col justify-center flex-1 w-full">
      <div class="relative w-[210px] h-[210px] mx-auto mb-8">
        <div class="absolute inset-4 rounded-full shadow-[0_0_40px_rgba(238,0,51,0.1)] mix-blend-multiply pointer-events-none"></div>
        <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90 relative z-10">
          <circle cx="50" cy="50" r="40" fill="none" class="stroke-slate-100" stroke-width="10" />
          <!-- Track 1 (label2) - Red -->
          <circle 
            cx="50" cy="50" r="40" fill="none" 
            class="stroke-[#ee0033]" stroke-width="10" 
            stroke-dasharray="251.2" 
            :stroke-dashoffset="getGaugeOffset(calcPercent(value2, value1 + value2))" 
            :transform="`rotate(${(value1 / (value1 + value2 || 1)) * 360} 50 50)`"
            stroke-linecap="round" 
          />
          <!-- Track 2 (label1) - Dark -->
          <circle 
            cx="50" cy="50" r="40" fill="none" 
            class="stroke-[#1b254b]" stroke-width="10" 
            stroke-dasharray="251.2" 
            :stroke-dashoffset="getGaugeOffset(calcPercent(value1, value1 + value2))" 
            stroke-linecap="round" 
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center z-20 text-center">
          <h4 class="text-[36px] font-[900] text-[#1b254b] leading-tight tracking-tighter mt-1">{{ (value1 + value2).toLocaleString() }}</h4>
          <p class="text-[9px] font-[900] text-[#ee0033] uppercase tracking-[0.2em] bg-red-50 px-3 py-1 rounded-full mt-1 border border-red-100/50">{{ unit }}</p>
        </div>
      </div>

      <div class="flex items-center justify-center gap-12 w-full mt-2">
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-3.5 h-3.5 bg-[#1b254b] rounded-full shadow-lg"></div>
            <span class="text-[22px] font-[900] text-[#1b254b] leading-none">{{ calcPercent(value1, value1 + value2) }}%</span>
          </div>
          <span class="text-[9px] font-[900] text-slate-400 uppercase tracking-widest">{{ label1 }}</span>
        </div>
        <div class="flex items-center justify-center h-10 w-px bg-slate-200"></div>
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-3.5 h-3.5 bg-[#ee0033] rounded-full shadow-lg"></div>
            <span class="text-[22px] font-[900] text-[#ee0033] leading-none">{{ calcPercent(value2, value1 + value2) }}%</span>
          </div>
          <span class="text-[9px] font-[900] text-slate-400 uppercase tracking-widest">{{ label2 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
