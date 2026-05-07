import api from "../utils/axios";

export const dashboardService = {
  getDashboardData: (params) => api.get("/dashboard", { params }),
  getStatus: () => api.get("/status"),
  getStaffNames: (params) => api.get("/staff", { params }),
  getPerformanceComparison: (params) =>
    api.get("/dashboard/performance-comparison", { params }),
  getSmeDashboardSummary: (params) =>
    api.get("/dashboard/sme-summary", { params }),
  getProductGroups: (source) =>
    api.get("/product-groups", { params: { source } }),
  getYears: () => api.get("/product/years"),
  refreshDashboard: () => api.post("/dashboard/refresh"),
};

export const adjustmentService = {
  getAdjustments: () => api.get("/adjustments"),
  createAdjustment: (data) => api.post("/adjustments", data),
  getAvailableStaff: (params) =>
    api.get("/adjustments/available-staff", { params }),
  deleteAdjustment: (id) => api.delete(`/adjustments/${id}`),
};

export const targetService = {
  getTargets: (params) => api.get("/targets", { params }),
  createTarget: (data) => api.post("/targets", data),
  deleteTarget: (params) => api.delete("/targets", { params }),
};

export const importService = {
  importProducts: (formData) =>
    api.post("/products/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importSales: (formData) =>
    api.post("/sales/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importTendooExpiredIds: (formData) =>
    api.post("/sales/import-expired-ids", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importMysignVasPrices: (formData) =>
    api.post("/sales/import-mysign-vas", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importMysignExpiredSubscribers: (formData) =>
    api.post("/sales/import-mysign-expired", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importCaUsedMst: (formData) =>
    api.post("/sales/import-ca-used-mst", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  importCaNewEnterprise: (formData) =>
    api.post("/sales/import-ca-new-ent", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const userService = {
  getUsers: () => api.get("/users"),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAuditLogs: () => api.get("/users/audit"),
};

export const settingService = {
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
};

export default api;
