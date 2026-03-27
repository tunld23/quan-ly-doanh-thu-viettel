import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import {
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByIdAndRefreshToken,
  findUserByRefreshToken,
  createUser,
  updateRefreshToken,
  removeRefreshToken
} from "../models/userModel.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role: role || "user"
    };

    await createUser(newUser);
    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password: encryptedPassword } = req.body;

    const secretKey = process.env.CRYPTO_SECRET_KEY || "ViettelSecureKey2026";
    let realPassword = "";

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        return res.status(401).json({ message: "Invalid payload signature" });
      }

      const parts = decryptedStr.split("|||");
      if (parts.length !== 2) {
        return res.status(401).json({ message: "Invalid payload structure" });
      }

      realPassword = parts[0];
      const timestamp = parseInt(parts[1], 10);

      // Check for replay attacks (Reject requests older than 2 minutes)
      if (Date.now() - timestamp > 120000) {
        return res.status(401).json({ message: "Request expired" });
      }
    } catch (err) {
      console.error("Decryption Error:", err);
      return res.status(401).json({ message: "Decryption failed or manipulation detected" });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(realPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload, 
      process.env.JWT_SECRET || "supersecretjwtkey_placeholder_123", 
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET || "supersecretrefreshtoken_placeholder_456",
      { expiresIn: "7d" }
    );

    await updateRefreshToken(user.id, refreshToken);

    res.status(200).json({ 
      message: "Login successful", 
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "supersecretrefreshtoken_placeholder_456");
    
    // Must find matching DB record
    const user = await findUserByIdAndRefreshToken(decoded.userId, token);
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const newAccessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || "supersecretjwtkey_placeholder_123",
      { expiresIn: "15m" }
    );

    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "No refresh token provided" });
  }

  const user = await findUserByRefreshToken(token);
  if (user) {
    await removeRefreshToken(token); 
  }

  res.status(200).json({ message: "Logged out successfully" });
};
