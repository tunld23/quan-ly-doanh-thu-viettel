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
      "product_type",
      "staff_service_count"
    ];

    console.log("Starting database cleanup (Dropping tables)...");

    for (const table of tables) {
      try {
        await db.request().query(`IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE ${table}`);
        console.log(`Dropped table: ${table}`);
      } catch (err) {
        console.error(`Error dropping ${table}:`, err.message);
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
