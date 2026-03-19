<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  form: Object,
  years: Array,
  productGroups: Array,
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

  // Adjust cursor position (advanced)
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
</script>

<template>
  <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 backdrop-blur-sm bg-white/90">
    <!-- ROW 1: Source Selection -->
    <div class="mb-6">
      <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
        <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        1. Kênh nạp dữ liệu
      </label>
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="form.source_type = 'dealer'"
          :class="`py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5 ${form.source_type === 'dealer' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-indigo-100'}`"
        >
          <span class="text-xs uppercase tracking-widest">Đại Lý</span>
          <span class="text-[10px] font-normal opacity-70 italic">Ủy Quyền</span>
        </button>
        <button
          @click="form.source_type = 'am'"
          :class="`py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5 ${form.source_type === 'am' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-indigo-100'}`"
        >
          <span class="text-xs uppercase tracking-widest">AM</span>
          <span class="text-[10px] font-normal opacity-70 italic">Account Manager</span>
        </button>
      </div>
    </div>

    <!-- ROW 2: Date Selection -->
    <div class="mb-6 pt-5 border-t border-gray-50">
      <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
        <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        2. Thời gian
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

    <!-- ROW 3: Product Group -->
    <div class="mb-6 pt-5 border-t border-gray-50">
      <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
        <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        3. Nhóm sản phẩm
      </label>
      <div class="relative">
        <select v-model="form.product_group" class="input-modern-sm">
          <option value="" disabled>-- Chọn nhóm --</option>
          <option v-for="pg in productGroups" :key="pg" :value="pg">
            {{ (pg === "Internet truyền hình" || pg === "Internet Truyền hình") ? "Internet" : pg }}
          </option>
        </select>
      </div>
    </div>

    <!-- ROW 4: Type/Amount -->
    <div class="mb-6 pt-5 border-t border-gray-50">
      <label class="flex items-center text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
        <svg class="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        4. Loại và Giá trị chỉ tiêu
      </label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select v-model="form.type" class="input-modern-sm font-bold">
          <option value="Thuê Bao">Chỉ tiêu Thuê Bao</option>
          <option value="Doanh thu">Chỉ tiêu Doanh thu</option>
        </select>
        <div class="relative">
          <input
            type="text"
            :value="form.amount === 0 ? '' : form.amount.toLocaleString('vi-VN')"
            @input="handleAmountInput"
            class="input-field-sm font-black"
            placeholder="0"
          />
          <div class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">
            {{ form.type === "Doanh thu" ? "đ" : "tb" }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end pt-5 border-t border-gray-50">
      <button
        @click="onSubmit"
        :disabled="submitting || !form.product_group"
        class="px-8 py-3 bg-blue-600 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all flex items-center space-x-2 uppercase tracking-widest text-xs"
      >
        <span v-if="submitting">Lưu...</span>
        <span v-else>Lưu mục tiêu</span>
      </button>
    </div>
  </div>
</template>

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
