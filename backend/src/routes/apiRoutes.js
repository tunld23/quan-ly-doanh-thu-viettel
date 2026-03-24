import express from "express";
import multer from "multer";
import { syncData } from "../controllers/syncController.js";
import {
  getDashboardData,
  getStatus,
  getSalesData,
  getStaffNames,
  refreshSummary
} from "../controllers/dashboardController.js";
import { 
  importProducts, 
  getProductGroups,
  getProductYears
} from "../controllers/productController.js";
import { importSales } from "../controllers/salesController.js";
import { 
  getAdjustments, 
  createAdjustment, 
  deleteAdjustment 
} from "../controllers/adjustmentController.js";
import {
  getTargets,
  createTarget,
  deleteTarget
} from "../controllers/targetController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/init", syncData);
router.get("/dashboard", getDashboardData);
router.post("/dashboard/refresh", refreshSummary);
router.get("/sales", getSalesData);
router.get("/status", getStatus);
router.get("/product-groups", getProductGroups);
router.get("/product/years", getProductYears);
router.get("/staff", getStaffNames);

// Adjustments
router.get("/adjustments", getAdjustments);
router.post("/adjustments", createAdjustment);
router.delete("/adjustments/:id", deleteAdjustment);

// Targets
router.get("/targets", getTargets);
router.post("/targets", createTarget);
router.delete("/targets", deleteTarget);

// New Product Import Route
router.post("/products/import", upload.single("file"), importProducts);
router.post("/sales/import", upload.single("file"), importSales);

export default router;
