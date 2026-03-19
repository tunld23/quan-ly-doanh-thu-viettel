<template>
  <div class="space-y-6">
    <!-- Row 1: Data Source Selection (Dealer / AM) -->
    <div
      class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-6"
    >
      <!-- Left: Source Toggle -->
      <div class="flex flex-col items-start">
        <h2
          class="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1"
        >
          Kênh nạp dữ liệu
        </h2>
        <div
          class="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50 w-fit"
        >
          <button
            v-for="source in sourceOptions"
            :key="source.id"
            @click="$emit('update:sourceType', source.id)"
            class="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
            :class="
              sourceType === source.id
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/40'
            "
          >
            <div
              class="flex items-center justify-center w-[18px] h-[18px] flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-full h-full"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  :d="source.icon"
                />
              </svg>
            </div>
            <span class="leading-none ml-1">{{ source.name }}</span>
          </button>
        </div>
      </div>

      <!-- Right: View Mode Toggle -->
      <div class="flex flex-col items-end">
        <h2
          class="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1"
        >
          Chế độ xem
        </h2>
        <div
          class="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50 w-fit"
        >
          <button
            @click="$emit('update:viewMode', 'actual')"
            class="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
            :class="
              viewMode === 'actual'
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/40'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Doanh Thu
          </button>
          <button
            @click="$emit('update:viewMode', 'target')"
            class="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
            :class="
              viewMode === 'target'
                ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/40'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Tỷ lệ hoàn thành
          </button>
        </div>
      </div>
    </div>

    <!-- Row 2: Category Tabs & Time Filters -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
    >
      <div
        class="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/20 gap-6"
      >
        <!-- Left Side: Category Tabs (Horizontal Scroll) -->
        <div class="flex items-center gap-10 min-w-0 flex-1">
          <div class="flex flex-col items-start min-w-0 w-full">
            <span
              class="text-[10px] font-bold text-blue-500/60 uppercase tracking-[0.2em] mb-1 px-0.5"
              >Danh mục</span
            >
            <div
              class="flex items-center gap-8 overflow-x-auto category-scrollbar pb-2 -mb-2 w-full"
            >
              <button
                v-for="mode in processedDataModes"
                :key="mode.id"
                @click="$emit('update:dataType', mode.id)"
                class="relative py-3 group transition-all duration-300 flex-shrink-0"
              >
                <span
                  class="text-[15px] font-bold transition-colors duration-300"
                  :class="
                    dataType === mode.id
                      ? 'text-gray-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  "
                >
                  {{ mode.name }}
                </span>
                <div
                  class="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-full transition-all duration-300 transform origin-left"
                  :class="
                    dataType === mode.id
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-30'
                  "
                ></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side: Time Filters (Year, Quarter, Month) -->
        <div class="flex flex-wrap items-center gap-6 py-4 md:py-0">
          <!-- Year Selector -->
          <div class="flex flex-col items-start">
            <span
              class="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2.5 px-0.5"
              >Thời gian</span
            >
            <div
              class="flex items-center gap-3 bg-white p-1 rounded-2xl border border-gray-200/60 shadow-sm"
            >
              <select
                :value="selectedYear"
                @change="$emit('update:selectedYear', $event.target.value)"
                class="bg-transparent pl-3 pr-2 py-1.5 outline-none font-bold text-gray-700 cursor-pointer min-w-[100px] text-[14px]"
              >
                <option value="">Tất cả</option>
                <option
                  v-for="year in availableYears"
                  :key="year"
                  :value="year"
                >
                  Năm {{ year }}
                </option>
              </select>

              <div class="w-px h-6 bg-gray-200 mx-1"></div>

              <!-- Filter Mode Toggle (Year/Quarter/Month) -->
              <div class="flex items-center p-0.5 bg-gray-50 rounded-xl">
                <button
                  v-for="mode in modeOptions"
                  :key="mode.id"
                  @click="changeFilterMode(mode.id)"
                  class="px-4 py-1.5 rounded-lg transition-all font-bold text-[13px]"
                  :class="
                    filterMode === mode.id
                      ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-700'
                  "
                >
                  {{ mode.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Month Selector (Dynamic) -->
          <div
            v-if="filterMode === 'month'"
            class="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300"
          >
            <span
              class="text-gray-500 font-medium ml-2 border-l border-gray-200 pl-4"
              >Chọn tháng:</span
            >
            <select
              :value="selectedMonth"
              @change="$emit('update:selectedMonth', $event.target.value)"
              class="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-300 transition-all font-bold"
            >
              <option value="">Tất cả các tháng</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                Tháng {{ m }}
              </option>
            </select>
          </div>

          <!-- Quarter Selector (Dynamic) -->
          <div
            v-if="filterMode === 'quarter'"
            class="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300"
          >
            <span
              class="text-gray-500 font-medium ml-2 border-l border-gray-200 pl-4"
              >Chọn quý:</span
            >
            <div
              class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <button
                v-for="q in availableQuarters"
                :key="q"
                @click="$emit('update:selectedQuarter', q)"
                class="px-4 py-1.5 transition-all text-[13px] font-bold border-r border-gray-100 last:border-0"
                :class="
                  selectedQuarter === q
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                "
              >
                Q{{ q }}
              </button>
              <button
                @click="$emit('update:selectedQuarter', '')"
                class="px-4 py-1.5 transition-all text-[13px] font-bold"
                :class="
                  selectedQuarter === ''
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                "
              >
                Tất cả
              </button>
            </div>
          </div>

          <!-- Comparison Mode Button -->
          <!-- <div class="flex items-center gap-2 ml-2 border-l border-gray-200 pl-4">
            <button
              @click="$emit('open-compare')"
              class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              So sánh
            </button>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  dataType: String,
  sourceType: String,
  activeMetric: String,
  selectedYear: String,
  filterMode: String,
  selectedMonth: String,
  selectedQuarter: String,
  viewMode: String,
  availableYears: Array,
  availableMonths: Array,
  availableQuarters: Array,
  metrics: Array,
  productGroups: Array,
});

const emit = defineEmits([
  "update:dataType",
  "update:sourceType",
  "update:activeMetric",
  "update:selectedYear",
  "update:filterMode",
  "update:viewMode",
  "update:selectedMonth",
  "update:selectedQuarter",
  "open-compare",
]);

// --- CONSTANTS ---

const sourceOptions = [
  {
    id: "all",
    name: "Tất cả",
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z",
  },
  {
    id: "dealer",
    name: "Đại lý",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    id: "am",
    name: "Account Manager (AM)",
    icon: "M15 9a3 3 0 11-6 0 3 3 0 016 0zM6.343 17.403a.75.75 0 01.196-.306 7.5 7.5 0 119.924 0 .75.75 0 01.196.306l1.274 4.053a.75.75 0 01-.969.94l-3.974-1.49a.75.75 0 00-.518 0l-3.974 1.49a.75.75 0 01-.969-.94l1.274-4.053z",
  },
];

const modeOptions = [
  { id: "all", name: "Năm" },
  { id: "quarter", name: "Quý" },
  { id: "month", name: "Tháng" },
];

// --- HELPER METHODS ---

const changeFilterMode = (modeId) => {
  emit("update:filterMode", modeId);
  emit("update:selectedMonth", "");
  emit("update:selectedQuarter", "");
};

const getCategoryName = (id) => {
  if (id === "Internet truyền hình" || id === "Internet Truyền hình")
    return "Internet";
  const nid = String(id).toLowerCase();
  if (nid === "all") return "Tất cả";
  if (nid === "hddt") return "Hóa đơn (HDDT)";
  return id;
};

// --- COMPUTED ---

const processedDataModes = computed(() => {
  const groups =
    props.productGroups?.length > 0 ? props.productGroups : ["all"];
  return groups.map((g) => ({
    id: g,
    name: getCategoryName(g),
  }));
});
</script>

<style scoped>
/* Scrollbar styling for a premium feel */
.category-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.category-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.category-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
  transition: all 0.3s;
}
.category-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Firefox scrollbar compatibility */
.category-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
</style>
