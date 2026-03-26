import api from '../utils/axios';

export const dashboardService = {
  getDashboardData: (params) => api.get('/dashboard', { params }),
  getStatus: () => api.get('/status'),
  getStaffNames: (params) => api.get('/staff', { params }),
  getProductGroups: (source) => api.get('/product-groups', { params: { source } }),
  getYears: () => api.get('/product/years'),
  refreshDashboard: () => api.post('/dashboard/refresh')
};

export const adjustmentService = {
  getAdjustments: () => api.get('/adjustments'),
  createAdjustment: (data) => api.post('/adjustments', data),
  getAvailableStaff: (params) => api.get('/adjustments/available-staff', { params }),
  deleteAdjustment: (id) => api.delete(`/adjustments/${id}`)
};

export const targetService = {
  getTargets: (params) => api.get('/targets', { params }),
  createTarget: (data) => api.post('/targets', data),
  deleteTarget: (params) => api.delete('/targets', { params })
};

export const importService = {
  importProducts: (formData) => api.post('/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  importSales: (formData) => api.post('/sales/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;
