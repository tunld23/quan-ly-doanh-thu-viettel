import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE
});

export const dashboardService = {
  getDashboardData: (params) => api.get('/dashboard', { params }),
  getStatus: () => api.get('/status'),
  getStaffNames: () => api.get('/staff'),
  getProductGroups: (source) => api.get('/product-groups', { params: { source } })
};

export const adjustmentService = {
  getAdjustments: () => api.get('/adjustments'),
  createAdjustment: (data) => api.post('/adjustments', data),
  deleteAdjustment: (id) => api.delete(`/adjustments/${id}`)
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
