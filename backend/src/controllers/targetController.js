import { getDb } from "../config/db.js";
import sql from "mssql/msnodesqlv8.js";

export const getTargets = async (req, res) => {
  try {
    const { year, month } = req.query;
    const db = await getDb();
    const request = db.request();
    
    let query = "SELECT * FROM targets WHERE 1=1";
    if (year) {
      query += " AND tr_year = @year";
      request.input("year", sql.Int, parseInt(year));
    }
    if (month) {
      query += " AND tr_month = @month";
      request.input("month", sql.NVarChar, month.padStart(2, "0"));
    }
    
    query += " ORDER BY tr_year DESC, tr_month DESC, source_type, product_group";
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTarget = async (req, res) => {
  try {
    const { tr_year, tr_month, source_type, product_group, type, amount } = req.body;
    
    if (!tr_year || !tr_month || !source_type || !product_group || !type || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    const request = db.request();
    
    request.input("tr_year", sql.Int, parseInt(tr_year));
    request.input("tr_month", sql.NVarChar, String(tr_month).padStart(2, "0"));
    request.input("source_type", sql.NVarChar, source_type);
    request.input("product_group", sql.NVarChar, product_group);
    request.input("type", sql.NVarChar, type);
    request.input("amount", sql.Float, parseFloat(amount));

    // Upsert logic: Delete existing before insert to prevent PK violation
    await request.query(`
      DELETE FROM targets 
      WHERE tr_year = @tr_year 
      AND tr_month = @tr_month 
      AND source_type = @source_type 
      AND product_group = @product_group 
      AND type = @type
    `);

    await request.query(`
      INSERT INTO targets (tr_year, tr_month, source_type, product_group, type, amount)
      VALUES (@tr_year, @tr_month, @source_type, @product_group, @type, @amount)
    `);

    res.status(201).json({ message: "Đã lưu chỉ tiêu thành công (Ghi đè nếu đã tồn tại)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTarget = async (req, res) => {
  try {
    const { tr_year, tr_month, source_type, product_group, type } = req.query;
    const db = await getDb();
    const request = db.request();
    
    request.input("tr_year", sql.Int, tr_year);
    request.input("tr_month", sql.NVarChar, tr_month);
    request.input("source_type", sql.NVarChar, source_type);
    request.input("product_group", sql.NVarChar, product_group);
    request.input("type", sql.NVarChar, type);

    await request.query(`
      DELETE FROM targets 
      WHERE tr_year = @tr_year 
      AND tr_month = @tr_month 
      AND source_type = @source_type 
      AND product_group = @product_group 
      AND type = @type
    `);
    
    res.json({ message: "Xóa chỉ tiêu thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
