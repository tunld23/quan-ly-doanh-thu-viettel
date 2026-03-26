import express from "express";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected route for logged in users
router.get("/profile", authenticateJWT, (req, res) => {
  // `req.user` contains the decoded JWT data
  res.json({
    message: "Welcome to your profile",
    user: req.user
  });
});

export default router;
