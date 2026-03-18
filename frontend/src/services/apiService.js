import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE
});

export const dashboardService = {
  getDashboardData: (params) => api.get('/dashboard', { params }),
  getStatus: () => api.get('/status'),
  getStaffNames: (params) => api.get('/staff', { params }),
  getProductGroups: (source) => api.get('/product-groups', { params: { source } }),
  getYears: () => api.get('/product/years')
};

export const adjustmentService = {
  getAdjustments: () => api.get('/adjustments'),
  createAdjustment: (data) => api.post('/adjustments', data),
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
