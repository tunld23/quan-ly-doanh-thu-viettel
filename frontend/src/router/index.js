import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../components/dashboard/Dashboard.vue";
import ProductImport from "../views/ProductImport.vue";
import SalesImport from "../views/SalesImport.vue";
import SalesAdjustment from "../views/SalesAdjustment.vue";
import TargetConfig from "../views/TargetConfig.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: Dashboard,
    },
    {
      path: "/products",
      name: "products",
      component: ProductImport,
    },
    {
      path: "/sales-import",
      name: "sales-import",
      component: SalesImport,
    },
    {
      path: "/adjustments",
      name: "adjustments",
      component: SalesAdjustment,
    },
    {
      path: "/targets",
      name: "targets",
      component: TargetConfig,
    },
  ],
});

export default router;
