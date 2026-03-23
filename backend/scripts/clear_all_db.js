import { getDb } from "../src/config/db.js";

async function clearAll() {
  try {
    const db = await getDb();
    const tables = [
      "product",
      "detail",
      "adjustments",
      "summary_report",
      "targets",
      "product_type"
    ];

    console.log("Starting database cleanup...");

    for (const table of tables) {
      try {
        await db.request().query(`DELETE FROM ${table}`);
        console.log(`Cleared table: ${table}`);
      } catch (err) {
        console.error(`Error clearing ${table}:`, err.message);
      }
    }

    console.log("All data has been cleared successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Critical error during cleanup:", err);
    process.exit(1);
  }
}

clearAll();
