import express from "express";
import multer from "multer";
import { syncData } from "../controllers/syncController.js";
import {
  getDashboardData,
  getStatus,
  getSalesData,
  getStaffNames
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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/init", syncData);
router.get("/dashboard", getDashboardData);
router.get("/sales", getSalesData);
router.get("/status", getStatus);
router.get("/product-groups", getProductGroups);
router.get("/product/years", getProductYears);
router.get("/staff", getStaffNames);

// Adjustments
router.get("/adjustments", getAdjustments);
router.post("/adjustments", createAdjustment);
router.delete("/adjustments/:id", deleteAdjustment);

// New Product Import Route
router.post("/products/import", upload.single("file"), importProducts);
router.post("/sales/import", upload.single("file"), importSales);

export default router;
