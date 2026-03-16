import { getDb } from "./src/config/db.js";

async function clearDatabase() {
  try {
    const db = await getDb();
    console.log("Clearing database...");
    
    await db.request().query("DELETE FROM summary_report");
    console.log("- Cleared summary_report");
    
    await db.request().query("DELETE FROM adjustments");
    console.log("- Cleared adjustments");
    
    await db.request().query("DELETE FROM detail");
    console.log("- Cleared detail");
    
    await db.request().query("DELETE FROM product");
    console.log("- Cleared product");
    
    console.log("Database cleared successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing database:", err);
    process.exit(1);
  }
}

clearDatabase();
