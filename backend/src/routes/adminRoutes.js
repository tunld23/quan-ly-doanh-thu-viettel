import express from "express";
import { authenticateJWT, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected route only for admins using authorize middleware
// authorize param can be a single role string or an array of allowed roles
router.get("/dashboard-stats", authenticateJWT, authorize(["admin"]), (req, res) => {
  res.json({
    message: "Admin area access successful.",
    stats: { totalUsers: 10, totalRevenue: 5000000 } // mock stats
  });
});

export default router;
