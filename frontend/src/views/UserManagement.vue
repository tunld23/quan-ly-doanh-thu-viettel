<script setup>
import { ref, onMounted } from "vue";
import { userService } from "../services/apiService";
import LoadingOverlay from "../components/common/LoadingOverlay.vue";

const users = ref([]);
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// MODAL STATES
const showCreateModal = ref(false);
const showEditModal = ref(false);
const isSubmitting = ref(false);

const newUser = ref({ username: "", email: "", password: "", role: "admin" });
const editUser = ref({ id: "", username: "", role: "admin", password: "" }); // password may be empty

const fetchUsers = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await userService.getUsers();
    users.value = res.data;
  } catch (err) {
    errorMsg.value = "Lỗi không thể tải danh sách tài khoản";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});

const handleCreateUser = async () => {
  isSubmitting.value = true;
  errorMsg.value = "";
  try {
    await userService.createUser(newUser.value);
    successMsg.value = `Đã tạo tài khoản ${newUser.value.username} thành công.`;
    showCreateModal.value = false;
    newUser.value = { username: "", email: "", password: "", role: "admin" };
    fetchUsers();
  } catch (err) {
    alert(err.response?.data?.message || "Lỗi tạo tài khoản");
  } finally {
    isSubmitting.value = false;
  }
};

const handleUpdateUser = async () => {
  if (!editUser.value.id) return;
  isSubmitting.value = true;
  try {
    const payload = { role: editUser.value.role };
    if (editUser.value.password) {
      payload.password = editUser.value.password;
    }
    await userService.updateUser(editUser.value.id, payload);
    successMsg.value = `Đã cập nhật tài khoản ${editUser.value.username} thành công.`;
    showEditModal.value = false;
    fetchUsers();
  } catch (err) {
    alert(err.response?.data?.message || "Lỗi cập nhật tài khoản");
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteUser = async (id, username) => {
  if (confirm(`Bạn có chắc chắn muốn xóa tài khoản [${username}]?`)) {
    try {
      await userService.deleteUser(id);
      successMsg.value = "Đã xóa tài khoản thành công!";
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi không thể xóa tài khoản");
    }
  }
};

const openEditModal = (u) => {
  editUser.value = {
    id: u.id,
    username: u.username,
    role: u.role,
    password: "" // password field initially empty for edit
  };
  showEditModal.value = true;
};
</script>

<template>
  <div class="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
    <LoadingOverlay :show="loading" statusText="Đang tải dữ liệu User..." />

    <!-- Tieu de -->
    <div class="flex items-center justify-between bg-white px-8 py-6 rounded-3xl shadow-sm border border-gray-100">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black text-gray-800 tracking-tight">Quản lý Tài khoản</h1>
          <p class="text-sm text-gray-500 font-medium mt-1">
            Quyền Truy cập: Super Admin
          </p>
        </div>
      </div>
      <div>
        <button 
          @click="showCreateModal = true"
          class="bg-[#ee0033] hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-red-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo tài khoản mới
        </button>
      </div>
    </div>

    <!-- Thông báo -->
    <div v-if="successMsg" class="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl font-medium flex items-center gap-3">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      {{ successMsg }}
    </div>
    
    <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl font-medium">
      {{ errorMsg }}
    </div>

    <!-- Bảng Danh Sách Người Dùng -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="p-4 px-6 text-[12px] font-black text-gray-500 uppercase tracking-widest">ID</th>
              <th class="p-4 px-6 text-[12px] font-black text-gray-500 uppercase tracking-widest">Tên đăng nhập</th>
              <th class="p-4 px-6 text-[12px] font-black text-gray-500 uppercase tracking-widest">Email</th>
              <th class="p-4 px-6 text-[12px] font-black text-gray-500 uppercase tracking-widest">Phân quyền</th>
              <th class="p-4 px-6 text-[12px] font-black text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in users" :key="user.id" class="hover:bg-red-50/30 transition-colors">
              <td class="p-4 px-6 text-sm font-medium text-gray-500">{{ user.id }}</td>
              <td class="p-4 px-6 text-sm font-bold text-gray-800">{{ user.username }}</td>
              <td class="p-4 px-6 text-sm text-gray-600">{{ user.email }}</td>
              <td class="p-4 px-6">
                <!-- Role Badge -->
                <span 
                  class="px-3 py-1 text-xs font-bold rounded-full border"
                  :class="{
                    'bg-purple-50 text-purple-700 border-purple-200': user.role === 'superadmin',
                    'bg-blue-50 text-blue-700 border-blue-200': user.role === 'admin',
                    'bg-gray-100 text-gray-600 border-gray-200': user.role === 'user'
                  }"
                >
                  {{ user.role.toUpperCase() }}
                </span>
              </td>
              <td class="p-4 px-6 text-right space-x-3 w-[150px]">
                <button 
                  @click="openEditModal(user)"
                  class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  v-if="user.id !== '1' && user.role !== 'superadmin'" 
                  @click="handleDeleteUser(user.id, user.username)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE MODAL -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <form @submit.prevent="handleCreateUser">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 class="text-lg font-black text-gray-800">Tạo tài khoản mới</h3>
            <button type="button" @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Tên đăng nhập *</label>
              <input v-model="newUser.username" type="text" required class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Email *</label>
              <input v-model="newUser.email" type="email" required class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Mật khẩu *</label>
              <input v-model="newUser.password" type="text" required class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Phân quyền</label>
              <select v-model="newUser.role" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
                <option value="user">User Thường</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          <div class="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button type="button" @click="showCreateModal = false" class="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" :disabled="isSubmitting" class="bg-[#ee0033] hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md">
              <span v-if="isSubmitting">Đang xử lý...</span>
              <span v-else>Xác nhận tạo</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- EDIT MODAL -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <form @submit.prevent="handleUpdateUser">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 class="text-lg font-black text-gray-800">Chỉnh sửa [{{ editUser.username }}]</h3>
            <button type="button" @click="showEditModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Reset Mật khẩu (Bỏ trống nếu không đổi)</label>
              <input v-model="editUser.password" type="text" placeholder="Nhập mật khẩu mới..." class="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Phân quyền</label>
              <select v-model="editUser.role" :disabled="editUser.id === '1'" class="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50">
                <option value="user">User Thường</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <p v-if="editUser.id === '1'" class="text-xs text-red-500 mt-1">Không thể đổi quyền Admin Gốc</p>
            </div>
          </div>
          <div class="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button type="button" @click="showEditModal = false" class="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" :disabled="isSubmitting" class="bg-[#ee0033] hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md">
              <span v-if="isSubmitting">Đang xử lý...</span>
              <span v-else>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
