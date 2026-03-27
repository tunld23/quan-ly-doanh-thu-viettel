import bcrypt from "bcryptjs";
import { logActivity } from "../config/db.js";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
  updateUserPassword,
  findUserByUsernameOrEmail,
  createUser,
} from "../models/userModel.js";
import { getDb } from "../config/db.js";

export const getListUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

export const createNewUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existingUser = await findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username hoặc Email đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    };

    await createUser(newUser);

    await logActivity(req.user, "CREATE_USER", "users", {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    res
      .status(201)
      .json({ message: "Tạo tài khoản thành công", id: newUser.id });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing user ID" });

    if (id === "1" || id === req.user.userId) {
      // Don't allow deleting original admin or self
      return res
        .status(403)
        .json({
          message: "Không thể xóa tài khoản của chính bạn hoặc admin gốc",
        });
    }

    await deleteUser(id);

    await logActivity(req.user, "DELETE_USER", "users", { id });

    res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const updateUserRolesOrPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, password, currentAdminPassword } = req.body;

    if (!id) return res.status(400).json({ message: "Missing user ID" });

    // In a real secure environment, verify the superadmin password before changing another user's password
    // But for this simple dashboard, we assume token is enough if they are superadmin.

    if (role) {
      // Don't let users remove admin rights from the hardcoded first admin
      if (id === "1" && role !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Không thể đổi quyền của admin gốc" });
      }
      await updateUserRole(id, role);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await updateUserPassword(id, hashedPassword);
    }

    await logActivity(req.user, "UPDATE_USER", "users", {
      id,
      role,
      passwordChanged: !!password,
    });

    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const getAuditHistory = async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .request()
      .query("SELECT TOP 1000 * FROM audit_logs ORDER BY timestamp DESC");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};
