<script setup>
import { PREDEFINED_TARGETS } from "../../composables/useTargets";

const props = defineProps({
  form: Object,
  years: Array,
  submitting: Boolean,
});

const emit = defineEmits(["submit"]);

const handleAmountInput = (e) => {
  const input = e.target;
  const originalValue = input.value;
  const originalCursor = input.selectionStart;

  // 1. Get digits only
  const digits = originalValue.replace(/\D/g, "");

  if (digits === "") {
    props.form.amount = 0;
    input.value = "";
    return;
  }

  // 2. Convert to number and update raw form (Mutating prop directly, okay because reactive ref in parent)
  const num = parseInt(digits, 10);
  props.form.amount = num;

  // 3. Format for display
  const formatted = num.toLocaleString("vi-VN");

  // 4. Update input value and restore cursor
  input.value = formatted;

  // Adjust cursor position
  const originalBeforeCursor = originalValue.substring(0, originalCursor);
  const digitsBeforeCursor = originalBeforeCursor.replace(/\D/g, "").length;

  let newCursor = 0;
  let digitCount = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitCount++;
    }
    newCursor = i + 1;
    if (digitCount === digitsBeforeCursor) break;
  }
  input.setSelectionRange(newCursor, newCursor);
};

const onSubmit = () => {
  emit("submit");
};

const getTargetInfo = (id) => PREDEFINED_TARGETS.find(t => t.id === id);
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 backdrop-blur-sm bg-white/90">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- LEFT COLUMN -->
      <div class="space-y-6">
        <!-- 1. THỜI GIAN -->
        <div class="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
          <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-400 mb-3 ml-1">
            <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            1. Thời gian áp dụng
          </label>
          <div class="grid grid-cols-2 gap-3">
            <select v-model="form.tr_month" class="input-modern-sm">
              <option v-for="m in 12" :key="m" :value="m.toString().padStart(2, '0')">Tháng {{ m }}</option>
            </select>
            <select v-model="form.tr_year" class="input-modern-sm">
              <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
            </select>
          </div>
        </div>

        <!-- 2. CHỈ TIÊU -->
        <div class="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
          <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-400 mb-3 ml-1">
            <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            2. Chọn Chỉ tiêu
          </label>
          <select v-model="form.target_id" class="input-modern-sm">
            <option v-for="pt in PREDEFINED_TARGETS" :key="pt.id" :value="pt.id">
              {{ pt.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="space-y-6">
        <!-- 3. GIÁ TRỊ -->
        <div class="p-4 bg-blue-50/30 rounded-xl border border-blue-100 h-full flex flex-col justify-center">
          <label class="flex items-center text-xs font-black uppercase tracking-wider text-blue-500 mb-4 ml-1">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            3. Giá trị mục tiêu
          </label>
          <div class="relative group">
            <input
              type="text"
              :value="form.amount === 0 ? '' : form.amount.toLocaleString('vi-VN')"
              @input="handleAmountInput"
              class="w-full pl-6 pr-16 py-4 rounded-2xl border-2 border-white bg-white shadow-inner focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-black text-2xl text-gray-800"
              placeholder="0"
            />
            <div class="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">
              {{ getTargetInfo(form.target_id)?.unit }}
            </div>
          </div>
          
          <div class="mt-4 flex items-center space-x-2 px-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phân loại:</span>
            <span class="text-[10px] font-black text-indigo-600 uppercase">{{ getTargetInfo(form.target_id)?.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
      <div class="text-[11px] text-gray-400 italic font-medium">
        * Lưu ý: Ghi đè nếu chỉ tiêu cho tháng đã tồn tại.
      </div>
      <button
        @click="onSubmit"
        :disabled="submitting || !form.target_id"
        class="px-12 py-4 bg-indigo-600 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-2xl transition-all flex items-center space-x-3 uppercase tracking-widest text-xs"
      >
        <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span v-if="submitting">Đang lưu kết quả...</span>
        <span v-else>Cập nhật chỉ tiêu</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-modern-sm {
  @apply w-full px-5 py-3.5 rounded-xl border-2 border-transparent bg-white hover:bg-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none font-bold text-gray-700 text-sm cursor-pointer shadow-sm;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}
</style>

<style scoped>
.input-modern-sm {
  @apply w-full px-4 py-2.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white focus:border-blue-500 transition-all outline-none appearance-none font-bold text-gray-700 text-sm cursor-pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}

.input-field-sm {
  @apply w-full pl-4 pr-9 py-2.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white focus:border-blue-500 transition-all outline-none font-black text-gray-800 text-sm;
}
</style>
