<script setup>
import { ref, computed, watch } from "vue";

import { dashboardService } from "../../services/apiService";

const props = defineProps({
  staffList: Array,
  submitting: Boolean,
});

const emit = defineEmits(["submit"]);

const containerRef = ref(null);
const showStaffDropdown = ref(false);
const searchStaff = ref("");

const filteredStaff = computed(() => {
  if (!searchStaff.value) return props.staffList || [];
  const query = searchStaff.value.toLowerCase().trim();
  return (props.staffList || []).filter((s) =>
    s.toLowerCase().includes(query)
  );
});

const selectStaff = (staff) => {
  form.value.nhan_vien = staff;
  searchStaff.value = staff;
  showStaffDropdown.value = false;
};

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    showStaffDropdown.value = false;
    // Nếu người dùng chưa chọn gì nhưng đã gõ, có thể reset ô search về giá trị đã chọn (nếu muốn)
    if (!form.value.nhan_vien) {
      searchStaff.value = "";
    } else {
      searchStaff.value = form.value.nhan_vien;
    }
  }
};

import { onMounted, onUnmounted } from "vue";
onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

const form = ref({
  tr_month: String(new Date().getMonth() + 1).padStart(2, "0"),
  tr_year: new Date().getFullYear(),
  nhan_vien: "",
  product_group: "",
  source_type: "dealer",
  adj_quantity: 0,
  adj_amount: 0,
  note: "",
});

const availableGroups = ref([]);

const fetchGroups = async () => {
  try {
    const res = await dashboardService.getProductGroups(form.value.source_type);
    availableGroups.value = res.data;
  } catch (err) {
    console.error("Failed to fetch groups:", err);
  }
};

watch(
  () => form.value.source_type,
  () => {
    form.value.product_group = "";
    fetchGroups();
  },
  { immediate: true },
);

const submitForm = () => {
  emit("submit", { ...form.value });
  // Reset numeric fields and notes after successful submit is handled by parent
};

defineExpose({
  reset: () => {
    form.value.adj_quantity = 0;
    form.value.adj_amount = 0;
    form.value.note = "";
    form.value.nhan_vien = "";
    searchStaff.value = "";
  },
});
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
    <h2 class="text-xl font-bold text-gray-700 mb-6 flex items-center">
      <svg
        class="w-6 h-6 mr-2 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Tạo lệnh điều chỉnh mới
    </h2>

    <form @submit.prevent="submitForm" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1"
            >Tháng</label
          >
          <select
            v-model="form.tr_month"
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option
              v-for="m in 12"
              :key="m"
              :value="String(m).padStart(2, '0')"
            >
              Tháng {{ m }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Năm</label>
          <input
            v-model.number="form.tr_year"
            type="number"
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div class="relative" ref="containerRef">
        <label class="block text-sm font-bold text-gray-700 mb-1">Nhân viên</label>
        <div class="relative group">
          <input 
            v-model="searchStaff" 
            @focus="showStaffDropdown = true"
            type="text" 
            placeholder="-- Chọn hoặc gõ tìm kiếm nhân viên --"
            class="w-full p-2.5 pr-10 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none bg-gray-50/50 font-normal text-gray-800 placeholder-black transition-all"
            :class="form.nhan_vien ? 'border-blue-100 bg-blue-50/10' : ''"
          >
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg class="w-5 h-5 transition-transform" :class="{ 'rotate-180': showStaffDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <!-- Dropdown với thiết kế Premium -->
          <div 
            v-if="showStaffDropdown" 
            class="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-2 py-2 animate-in fade-in zoom-in duration-200"
          >
            <div v-if="filteredStaff.length === 0" class="px-4 py-3 text-center text-gray-400 italic text-sm">
              Không tìm thấy nhân viên nào
            </div>
            <div 
              v-for="staff in filteredStaff" 
              :key="staff" 
              @mousedown="selectStaff(staff)"
              class="px-4 py-2.5 hover:bg-blue-600 hover:text-white cursor-pointer text-sm text-gray-700 transition-colors flex items-center justify-between"
              :class="form.nhan_vien === staff ? 'bg-blue-50 font-bold text-blue-700' : ''"
            >
              <span>{{ staff }}</span>
              <svg v-if="form.nhan_vien === staff" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="flex items-center text-sm font-bold text-gray-700 mb-3">
          <svg
            class="w-4 h-4 mr-2 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Kênh nạp dữ liệu
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="form.source_type = 'dealer'"
            class="py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5"
            :class="
              form.source_type !== 'am'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm scale-[1.01]'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'
            "
          >
            <span class="text-[11px] uppercase tracking-wider">Đại Lý</span>
            <span class="text-[9px] font-normal opacity-70">Ủy Quyền</span>
          </button>
          <button
            type="button"
            @click="form.source_type = 'am'"
            class="py-3 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center space-y-0.5"
            :class="
              form.source_type === 'am'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm scale-[1.01]'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'
            "
          >
            <span class="text-[11px] uppercase tracking-wider">AM</span>
            <span class="text-[9px] font-normal opacity-70"
              >Account Manager</span
            >
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-bold text-gray-700 mb-1"
          >Nhóm sản phẩm</label
        >
        <select
          v-model="form.product_group"
          class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>-- Chọn nhóm sản phẩm --</option>
          <option v-for="group in availableGroups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1"
            >Số lượng (+/-)</label
          >
          <input
            v-model.number="form.adj_quantity"
            type="number"
            class="w-full p-2 border rounded-lg outline-none font-bold"
            :class="form.adj_quantity >= 0 ? 'text-green-600' : 'text-red-600'"
          />
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1"
            >Số tiền (+/-)</label
          >
          <input
            v-model.number="form.adj_amount"
            type="number"
            class="w-full p-2 border rounded-lg outline-none font-bold"
            :class="form.adj_amount >= 0 ? 'text-green-600' : 'text-red-600'"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-bold text-gray-700 mb-1"
          >Ghi chú</label
        >
        <textarea
          v-model="form.note"
          rows="3"
          class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Lý do điều chỉnh..."
        ></textarea>
      </div>

      <button
        type="submit"
        :disabled="submitting || !form.nhan_vien"
        class="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-all text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2"
      >
        <span
          v-if="submitting"
          class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
        ></span>
        <span>{{ submitting ? "Đang lưu..." : "Lưu điều chỉnh" }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.placeholder-black::placeholder {
  color: #000 !important;
  opacity: 1;
}

/* Tùy chỉnh thanh cuộn cho dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

@keyframes animate-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
