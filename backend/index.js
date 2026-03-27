import dotenv from "dotenv";
import app from "./src/app.js";
import { getDb } from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize Database Connection
    await getDb();
    console.log("Database initialized successfully.");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on all interfaces at port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
