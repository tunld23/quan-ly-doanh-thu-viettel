import { getDb, logActivity } from "../config/db.js";
import sql from "mssql/msnodesqlv8.js";

// Get single setting by key
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const db = await getDb();
    
    // Auto-create table if somehow it missed initDb
    await db.request().query(`
      IF OBJECT_ID('settings', 'U') IS NULL
      BEGIN
        CREATE TABLE settings (
          setting_key NVARCHAR(255) PRIMARY KEY,
          setting_value NVARCHAR(MAX)
        );
      END
    `);

    const result = await db.request()
      .input("key", sql.NVarChar, key)
      .query("SELECT setting_value FROM settings WHERE setting_key = @key");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Setting not found" });
    }

    let val = result.recordset[0].setting_value;
    try {
      val = JSON.parse(val);
    } catch(e) {
      // return as string if not valid JSON
    }

    res.json({ key, value: val });
  } catch (err) {
    console.error("Get Setting Error:", err);
    res.status(500).json({ error: "Failed to get setting" });
  }
};

// Update existing setting or create if not exists
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    let { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    const db = await getDb();

    // Ensure table exists
    await db.request().query(`
      IF OBJECT_ID('settings', 'U') IS NULL
      BEGIN
        CREATE TABLE settings (
          setting_key NVARCHAR(255) PRIMARY KEY,
          setting_value NVARCHAR(MAX)
        );
      END
    `);

    const request = db.request();
    request.input("key", sql.NVarChar, key);
    request.input("value", sql.NVarChar, value);

    const check = await request.query("SELECT 1 FROM settings WHERE setting_key = @key");
    
    if (check.recordset.length > 0) {
      await request.query("UPDATE settings SET setting_value = @value WHERE setting_key = @key");
    } else {
      await request.query("INSERT INTO settings (setting_key, setting_value) VALUES (@key, @value)");
    }

    await logActivity(req.user, 'UPDATE_SETTING', 'settings', `Updated setting ${key}`);

    res.json({ message: "Setting updated successfully", key });
  } catch (err) {
    console.error("Update Setting Error:", err);
    res.status(500).json({ error: "Failed to update setting" });
  }
};
