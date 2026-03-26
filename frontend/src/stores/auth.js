import { defineStore } from "pinia";
import api from "../utils/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    refreshToken: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === "admin",
  },
  actions: {
    async login(credentials) {
      try {
        const response = await api.post("/auth/login", credentials);
        this.token = response.data.token;
        this.refreshToken = response.data.refreshToken;
        this.user = response.data.user;

        // Lưu vào localStorage
        localStorage.setItem("token", this.token);
        localStorage.setItem("refreshToken", this.refreshToken);
        localStorage.setItem("user", JSON.stringify(this.user));
        return true;
      } catch (error) {
        console.error("Login Error:", error);
        throw error;
      }
    },
    async logout() {
      // Báo cho server huỷ refresh token nếu còn tồn tại
      if (this.refreshToken) {
        try {
          await api.post("/auth/logout", { token: this.refreshToken });
        } catch (e) {
          console.error("Logout request failed:", e);
        }
      }
      this.logoutLocally();
    },
    logoutLocally() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    tryAutoLogin() {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const user = localStorage.getItem("user");
      
      if (token && user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = JSON.parse(user);
      }
    },
    async refreshAuthToken() {
      try {
        // Gọi thẳng axios gốc để không dính interceptor và infinite loop
        const { default: axios } = await import('axios');
        const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.2.11:3000/api";
        
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          token: this.refreshToken
        });
        
        this.token = response.data.token;
        localStorage.setItem("token", this.token);
        
        return this.token;
      } catch (error) {
        this.logoutLocally();
        throw error;
      }
    }
  }
});
