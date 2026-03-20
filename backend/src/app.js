import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/apiRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// 1. Phục vụ các file tĩnh từ thư mục build của frontend
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// 2. Định nghĩa các API
app.use("/api", apiRoutes);

// 3. Quan trọng: Mọi yêu cầu không phải API thì trả về file index.html của Frontend
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

export default app;
