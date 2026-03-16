import { getDb } from './src/config/db.js';

async function testConnection() {
  try {
    console.log("Testing connection...");
    const db = await getDb();
    console.log("Connection successful!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
