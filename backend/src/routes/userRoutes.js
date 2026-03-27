import express from "express";
import { authenticateJWT, authorize } from "../middlewares/authMiddleware.js";
import { getListUsers, createNewUser, deleteUserById, updateUserRolesOrPassword, getAuditHistory } from "../controllers/userController.js";

const router = express.Router();

// Protected route for logged in users
router.get("/profile", authenticateJWT, (req, res) => {
  // `req.user` contains the decoded JWT data
  res.json({
    message: "Welcome to your profile",
    user: req.user
  });
});

// SUPER ADMIN ONLY routes for user management and audit
router.get("/audit", authenticateJWT, authorize(["superadmin"]), getAuditHistory);
router.get("/", authenticateJWT, authorize(["superadmin"]), getListUsers);
router.post("/", authenticateJWT, authorize(["superadmin"]), createNewUser);
router.delete("/:id", authenticateJWT, authorize(["superadmin"]), deleteUserById);
router.put("/:id", authenticateJWT, authorize(["superadmin"]), updateUserRolesOrPassword);

export default router;
