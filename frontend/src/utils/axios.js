import axios from "axios";

// Create custom axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 and 403 globally
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handling 401 Unauthorized globally
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { useAuthStore } = await import('../stores/auth');
        const authStore = useAuthStore();
        
        const newToken = await authStore.refreshAuthToken();
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        
        processQueue(null, newToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.warn("Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại");
        
        const { useAuthStore } = await import('../stores/auth');
        const authStore = useAuthStore();
        authStore.logoutLocally();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handling 403 Forbidden globally
    if (error.response && error.response.status === 403) {
      console.warn("Bạn không có quyền truy cập vào chức năng này");
      alert("Bạn không có quyền truy cập chức năng này!");
    }
    return Promise.reject(error);
  }
);

export default api;
