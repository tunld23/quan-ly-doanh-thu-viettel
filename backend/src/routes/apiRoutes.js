import express from "express";
import multer from "multer";
import {
  getDashboardData,
  getStatus,
  getSalesData,
  getStaffNames,
  refreshSummary,
  getPerformanceComparisons,
  getSmeDashboardSummary,
} from "../controllers/dashboardController.js";
import {
  importProducts,
  getProductGroups,
  getProductYears,
} from "../controllers/productController.js";
import {
  importSales,
  importTendooExpiredIds,
  importMysignVasPrices,
  importMysignExpiredSubscribers,
  importCaUsedMst,
  importCaNewEnterprise,
} from "../controllers/salesController.js";
import {
  getAdjustments,
  createAdjustment,
  getAvailableStaff,
  deleteAdjustment,
} from "../controllers/adjustmentController.js";
import {
  getTargets,
  createTarget,
  deleteTarget,
} from "../controllers/targetController.js";
import { getSetting, updateSetting } from "../controllers/configController.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/dashboard", getDashboardData);
router.get("/dashboard/performance-comparison", getPerformanceComparisons);
router.post("/dashboard/refresh", refreshSummary);
router.get("/dashboard/sme-summary", getSmeDashboardSummary);
router.get("/sales", getSalesData);
router.get("/status", getStatus);
router.get("/product-groups", getProductGroups);
router.get("/product/years", getProductYears);
router.get("/staff", getStaffNames);

// Adjustments
router.get("/adjustments", getAdjustments);
router.get("/adjustments/available-staff", getAvailableStaff);
router.post("/adjustments", createAdjustment);
router.delete("/adjustments/:id", deleteAdjustment);

// Targets
router.get("/targets", getTargets);
router.post("/targets", createTarget);
router.delete("/targets", deleteTarget);

// New Product Import Route
router.post("/products/import", upload.single("file"), importProducts);
router.post("/sales/import", upload.single("file"), importSales);
router.post(
  "/sales/import-expired-ids",
  upload.single("file"),
  importTendooExpiredIds,
);
router.post(
  "/sales/import-mysign-vas",
  upload.single("file"),
  importMysignVasPrices,
);
router.post(
  "/sales/import-mysign-expired",
  upload.single("file"),
  importMysignExpiredSubscribers,
);
router.post(
  "/sales/import-ca-used-mst",
  upload.single("file"),
  importCaUsedMst,
);
router.post(
  "/sales/import-ca-new-ent",
  upload.single("file"),
  importCaNewEnterprise,
);

// Settings
router.get("/settings/:key", getSetting);
router.put("/settings/:key", updateSetting);

// Auth & Profiles
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

export default router;
