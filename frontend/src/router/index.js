import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../components/dashboard/Dashboard.vue";
import ProductImport from "../views/ProductImport.vue";
import SalesImport from "../views/SalesImport.vue";
import SalesAdjustment from "../views/SalesAdjustment.vue";
import TargetConfig from "../views/TargetConfig.vue";
import LoginView from "../views/LoginView.vue";
import UserManagement from "../views/UserManagement.vue";
import AuditLogs from "../views/AuditLogs.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: "/",
      name: "dashboard",
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: "/products",
      name: "products",
      component: ProductImport,
      meta: { requiresAuth: true, roles: ['admin', 'superadmin'] }
    },
    {
      path: "/sales-import",
      name: "sales-import",
      component: SalesImport,
      meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } 
    },
    {
      path: "/adjustments",
      name: "adjustments",
      component: SalesAdjustment,
      meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } 
    },
    {
      path: "/targets",
      name: "targets",
      component: TargetConfig,
      meta: { requiresAuth: true, roles: ['admin', 'superadmin'] } 
    },
    {
      path: "/users",
      name: "users",
      component: UserManagement,
      meta: { requiresAuth: true, roles: ['superadmin'] } 
    },
    {
      path: "/audit-logs",
      name: "audit-logs",
      component: AuditLogs,
      meta: { requiresAuth: true, roles: ['superadmin'] } 
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    alert("Bạn không có quyền truy cập trang này!");
    next('/');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
